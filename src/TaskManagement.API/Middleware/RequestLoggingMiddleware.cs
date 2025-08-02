using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

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
            var userName = context.User.Identity?.IsAuthenticated == true ? 
                context.User.Identity.Name ?? "authenticated_user" : "anonymous";
                
            // Determine if this is a high priority event
            var isHighPriority = endpoint.Contains("/tasks", StringComparison.OrdinalIgnoreCase) && 
                (method == "POST" || method == "PUT" || method == "DELETE");
                
            // Determine action description
            string action = DetermineAction(method, endpoint);
            
            var logMessage = $"HTTP {method} {endpoint} requested from {ipAddress}";
            
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
        
        private string DetermineAction(string method, string path)
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
                switch (method)
                {
                    case "GET":
                        return string.IsNullOrEmpty(taskId) ? "viewed all tasks" : $"viewed task '{taskId}'";
                    case "POST":
                        return "created task";
                    case "PUT":
                        return $"updated task '{taskId}'";
                    case "DELETE":
                        return $"deleted task '{taskId}'";
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