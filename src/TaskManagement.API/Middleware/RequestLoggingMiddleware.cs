using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using System.Linq;
using System.Text.Json;

namespace TaskManagement.API.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;
        private readonly IServiceProvider _serviceProvider;

        public RequestLoggingMiddleware(
            RequestDelegate next, 
            ILogger<RequestLoggingMiddleware> logger,
            IServiceProvider serviceProvider)
        {
            _next = next;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public async System.Threading.Tasks.Task InvokeAsync(HttpContext context)
        {
            // Log the API request
            await LogRequestAsync(context);
            
            // Call the next delegate/middleware in the pipeline
            await _next(context);
        }

        private async System.Threading.Tasks.Task LogRequestAsync(HttpContext context)
        {
            var request = context.Request;
            var endpoint = request.Path.ToString();
            var method = request.Method;
            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
            // Improved user identification
            string userName = "anonymous";
            
            // Check if user is authenticated
            if (context.User.Identity?.IsAuthenticated == true)
            {
                // Get username directly from the Name claim
                userName = context.User.Identity.Name ?? "authenticated_user";
            }
            else
            {
                // For login/register endpoints, try to extract username from the request body
                if (endpoint.Contains("/auth/login") || endpoint.Contains("/auth/register"))
                {
                    try
                    {
                        // Enable buffering so we can read the body multiple times
                        context.Request.EnableBuffering();
                        
                        // Read the request body
                        using var reader = new StreamReader(
                            context.Request.Body,
                            encoding: System.Text.Encoding.UTF8,
                            detectEncodingFromByteOrderMarks: false,
                            leaveOpen: true);
                        
                        var body = await reader.ReadToEndAsync();
                        context.Request.Body.Position = 0; // Reset the position
                        
                        // Extract username if possible
                        if (body.Contains("\"username\""))
                        {
                            try 
                            {
                                // Very basic extraction - a real implementation would use JSON parsing
                                var usernameStart = body.IndexOf("\"username\"");
                                var valueStart = body.IndexOf(":", usernameStart) + 1;
                                var valueEnd = body.IndexOf(",", valueStart);
                                if (valueEnd == -1) valueEnd = body.IndexOf("}", valueStart);
                                
                                if (valueStart > 0 && valueEnd > valueStart)
                                {
                                    var usernameValue = body.Substring(valueStart, valueEnd - valueStart).Trim();
                                    // Remove quotes if present
                                    usernameValue = usernameValue.Trim('"', ' ');
                                    
                                    if (!string.IsNullOrEmpty(usernameValue))
                                    {
                                        userName = $"{usernameValue} (login attempt)";
                                    }
                                }
                            }
                            catch 
                            {
                                // If parsing fails, fall back to anonymous
                            }
                        }
                    }
                    catch
                    {
                        // If reading body fails, fall back to anonymous
                    }
                }
            }
            
            // Store task title for POST requests
            string? taskTitle = null;
            
            // Determine if this is a high priority event - more specific determination
            bool isHighPriority = false;
            
            if (endpoint.Contains("/tasks", StringComparison.OrdinalIgnoreCase) && 
                (method == "POST" || method == "PUT" || method == "DELETE"))
            {
                // Only for task updates that involve a high priority task
                try
                {
                    // For POST and PUT, we can check the request body
                    if (method == "POST" || method == "PUT")
                    {
                        context.Request.EnableBuffering();
                        using var reader = new StreamReader(
                            context.Request.Body, 
                            encoding: System.Text.Encoding.UTF8,
                            detectEncodingFromByteOrderMarks: false,
                            leaveOpen: true);
                        
                        var body = await reader.ReadToEndAsync();
                        context.Request.Body.Position = 0; // Reset the position
                        
                        // Check if this contains a high priority task
                        isHighPriority = body.Contains("\"priority\":2") || body.Contains("\"priority\": 2");
                        
                        // For POST requests, extract the task title
                        if (method == "POST" && body.Contains("\"title\""))
                        {
                            try
                            {
                                // Extract the title from the request body
                                var titleStart = body.IndexOf("\"title\"");
                                var valueStart = body.IndexOf(":", titleStart) + 1;
                                var valueEnd = body.IndexOf(",", valueStart);
                                if (valueEnd == -1) valueEnd = body.IndexOf("}", valueStart);
                                
                                if (valueStart > 0 && valueEnd > valueStart)
                                {
                                    taskTitle = body.Substring(valueStart, valueEnd - valueStart).Trim();
                                    // Remove quotes if present
                                    taskTitle = taskTitle.Trim('"', ' ');
                                }
                            }
                            catch
                            {
                                // If extraction fails, taskTitle remains null
                            }
                        }
                    }
                    // For DELETE, we'd need to check the database for the task's priority
                    else if (method == "DELETE")
                    {
                        // Extract task ID from the path
                        string? taskId = null;
                        var segments = endpoint.Split('/');
                        if (segments.Length > 3)
                        {
                            taskId = segments[3];
                        }
                        
                        if (!string.IsNullOrEmpty(taskId) && int.TryParse(taskId, out int id))
                        {
                            using var scope = _serviceProvider.CreateScope();
                            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                            var task = await dbContext.Tasks.FindAsync(id);
                            
                            if (task != null && task.Priority == Priority.High)
                            {
                                isHighPriority = true;
                            }
                        }
                    }
                }
                catch
                {
                    // If we can't determine the priority, default to normal
                    isHighPriority = false;
                }
            }
                
            // Determine action description with task titles
            string action = await DetermineActionAsync(method, endpoint, taskTitle);
            
            var logMessage = $"HTTP {method} {endpoint} requested from {ipAddress} by {userName}";
            
            _logger.LogInformation(logMessage);
            
            // Write to a file as required by the challenge
            string logFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "api_requests.log");
            File.AppendAllText(logFilePath, $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} - {logMessage}{Environment.NewLine}");
            
            // Create a new scope to resolve the DbContext
            using (var scope = _serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                
                // Store in database
                var logEntry = new LogEntry
                {
                    Timestamp = DateTime.Now,
                    User = userName,
                    Method = method,
                    Endpoint = endpoint,
                    IP = ipAddress,
                    Priority = isHighPriority ? "high" : "normal",
                    Action = action
                };
                
                dbContext.Logs.Add(logEntry);
                await dbContext.SaveChangesAsync();
            }
        }
        
        private async System.Threading.Tasks.Task<string> DetermineActionAsync(string method, string path, string? extractedTaskTitle = null)
        {
            // Extract task ID if present in the path
            string? taskId = null;
            var segments = path.Split('/');
            if (segments.Length > 3 && 
                segments[1].Equals("api", StringComparison.OrdinalIgnoreCase) && 
                segments[2].Equals("Tasks", StringComparison.OrdinalIgnoreCase))
            {
                if (segments.Length > 3)
                {
                    taskId = segments[3];
                }
            }
            
            if (path.Contains("/Tasks", StringComparison.OrdinalIgnoreCase))
            {
                // For operations that need task details
                if (!string.IsNullOrEmpty(taskId) && int.TryParse(taskId, out int id))
                {
                    using var scope = _serviceProvider.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    
                    switch (method)
                    {
                        case "GET":
                            var getTask = await dbContext.Tasks.FindAsync(id);
                            return getTask != null 
                                ? $"viewed task '{getTask.Title}'" 
                                : $"viewed task with ID {taskId}";
                        
                        case "PUT":
                            var updateTask = await dbContext.Tasks.FindAsync(id);
                            return updateTask != null 
                                ? $"updated task '{updateTask.Title}'" 
                                : $"updated task with ID {taskId}";
                        
                        case "DELETE":
                            var deleteTask = await dbContext.Tasks.FindAsync(id);
                            return deleteTask != null 
                                ? $"deleted task '{deleteTask.Title}'" 
                                : $"deleted task with ID {taskId}";
                    }
                }
                
                // Default cases for task operations
                switch (method)
                {
                    case "GET":
                        return "viewed all tasks";
                    case "POST":
                        // Use the extracted title if available
                        return !string.IsNullOrEmpty(extractedTaskTitle) 
                            ? $"created a new task '{extractedTaskTitle}'" 
                            : "created a new task";
                }
            }
            else if (path.Contains("/auth/login", StringComparison.OrdinalIgnoreCase))
            {
                return "attempted login";
            }
            else if (path.Contains("/auth/register", StringComparison.OrdinalIgnoreCase))
            {
                return "registered account";
            }
            else if (path.Contains("/logs", StringComparison.OrdinalIgnoreCase))
            {
                if (method == "GET")
                {
                    if (path.Contains("highpriority"))
                        return "viewed high priority logs";
                    else if (path.Contains("daterange"))
                        return "viewed logs by date range";
                    else if (path.Contains("export"))
                        return "exported logs to CSV";
                    else
                        return "viewed all logs";
                }
            }
            
            return $"{method.ToLower()} {path}";
        }
    }

    // Extension method used to add the middleware to the HTTP request pipeline
    public static class RequestLoggingMiddlewareExtensions
    {
        public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RequestLoggingMiddleware>();
        }
    }
}