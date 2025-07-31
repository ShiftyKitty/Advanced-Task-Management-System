using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace TaskManagement.API.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Log the API request
            LogRequest(context);
            
            // Call the next delegate/middleware in the pipeline
            await _next(context);
        }

        private void LogRequest(HttpContext context)
        {
            var request = context.Request;
            var logMessage = $"HTTP {request.Method} {request.Path} requested from {context.Connection.RemoteIpAddress}";
            
            _logger.LogInformation(logMessage);
            
            // Write to a file as required by the challenge
            string logFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "api_requests.log");
            File.AppendAllText(logFilePath, $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} - {logMessage}{Environment.NewLine}");
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