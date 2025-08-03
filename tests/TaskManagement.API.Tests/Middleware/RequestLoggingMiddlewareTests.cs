using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks; // This is the async Task
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using TaskManagement.API.Data;
using TaskManagement.API.Middleware;
using TaskManagement.API.Models;
using Xunit;
using FluentAssertions;
using System.Security.Claims;

namespace TaskManagement.API.Tests.Middleware
{
    public class RequestLoggingMiddlewareTests
    {
        [Fact]
        public async System.Threading.Tasks.Task InvokeAsync_LogsBasicRequestInfo()
        {
            // Arrange
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Method = "GET";
            httpContext.Request.Path = "/api/tasks";
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
            
            var mockLogger = new Mock<ILogger<RequestLoggingMiddleware>>();
            
            // Setup DbContext with in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            var dbContext = new ApplicationDbContext(options);
            
            // Setup service provider to return our DbContext
            var mockServiceScope = new Mock<IServiceScope>();
            mockServiceScope.Setup(x => x.ServiceProvider).Returns(MockServiceProvider(dbContext).Object);
            
            var mockServiceScopeFactory = new Mock<IServiceScopeFactory>();
            mockServiceScopeFactory
                .Setup(x => x.CreateScope())
                .Returns(mockServiceScope.Object);
            
            var mockServiceProvider = new Mock<IServiceProvider>();
            mockServiceProvider
                .Setup(x => x.GetService(typeof(IServiceScopeFactory)))
                .Returns(mockServiceScopeFactory.Object);
            
            // Setup RequestDelegate (next middleware)
            RequestDelegate next = (innerHttpContext) => System.Threading.Tasks.Task.CompletedTask;
            
            var middleware = new RequestLoggingMiddleware(next, mockLogger.Object, mockServiceProvider.Object);
            
            // Act
            await middleware.InvokeAsync(httpContext);
            
            // Assert
            // Verify log was written
            mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("GET") && 
                                                  v.ToString().Contains("/api/tasks") &&
                                                  v.ToString().Contains("127.0.0.1")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
            
            // Verify entry was added to database
            var logs = await dbContext.Logs.ToListAsync();
            logs.Should().HaveCount(1);
            logs[0].Method.Should().Be("GET");
            logs[0].Endpoint.Should().Be("/api/tasks");
            logs[0].IP.Should().Be("127.0.0.1");
            logs[0].User.Should().Be("anonymous");
            logs[0].Priority.Should().Be("normal");
            logs[0].Action.Should().Be("viewed all tasks");
        }
        
        [Fact]
        public async System.Threading.Tasks.Task InvokeAsync_WithAuthenticatedUser_LogsUsername()
        {
            // Arrange
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Method = "GET";
            httpContext.Request.Path = "/api/tasks";
            
            // Setup authenticated user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, "test_user")
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            httpContext.User = principal;
            
            var mockLogger = new Mock<ILogger<RequestLoggingMiddleware>>();
            
            // Setup DbContext with in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            var dbContext = new ApplicationDbContext(options);
            
            // Setup service provider
            var mockServiceScope = new Mock<IServiceScope>();
            mockServiceScope.Setup(x => x.ServiceProvider).Returns(MockServiceProvider(dbContext).Object);
            
            var mockServiceScopeFactory = new Mock<IServiceScopeFactory>();
            mockServiceScopeFactory
                .Setup(x => x.CreateScope())
                .Returns(mockServiceScope.Object);
            
            var mockServiceProvider = new Mock<IServiceProvider>();
            mockServiceProvider
                .Setup(x => x.GetService(typeof(IServiceScopeFactory)))
                .Returns(mockServiceScopeFactory.Object);
            
            RequestDelegate next = (innerHttpContext) => System.Threading.Tasks.Task.CompletedTask;
            
            var middleware = new RequestLoggingMiddleware(next, mockLogger.Object, mockServiceProvider.Object);
            
            // Act
            await middleware.InvokeAsync(httpContext);
            
            // Assert
            var logs = await dbContext.Logs.ToListAsync();
            logs.Should().HaveCount(1);
            logs[0].User.Should().Be("test_user");
        }
        
        [Fact]
        public async System.Threading.Tasks.Task InvokeAsync_ForTaskPostRequest_LogsHighPriorityWhenNeeded()
        {
            // Arrange
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Method = "POST";
            httpContext.Request.Path = "/api/tasks";
            
            // Setup request body with high priority task
            string requestBody = @"{""title"":""Critical Task"",""description"":""Important task"",""priority"":2,""status"":0}";
            var bytes = Encoding.UTF8.GetBytes(requestBody);
            
            httpContext.Request.Body = new MemoryStream(bytes);
            httpContext.Request.ContentType = "application/json";
            httpContext.Request.ContentLength = bytes.Length;
            
            var mockLogger = new Mock<ILogger<RequestLoggingMiddleware>>();
            
            // Setup DbContext with in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            var dbContext = new ApplicationDbContext(options);
            
            // Setup service provider
            var mockServiceScope = new Mock<IServiceScope>();
            mockServiceScope.Setup(x => x.ServiceProvider).Returns(MockServiceProvider(dbContext).Object);
            
            var mockServiceScopeFactory = new Mock<IServiceScopeFactory>();
            mockServiceScopeFactory
                .Setup(x => x.CreateScope())
                .Returns(mockServiceScope.Object);
            
            var mockServiceProvider = new Mock<IServiceProvider>();
            mockServiceProvider
                .Setup(x => x.GetService(typeof(IServiceScopeFactory)))
                .Returns(mockServiceScopeFactory.Object);
            
            RequestDelegate next = (innerHttpContext) => System.Threading.Tasks.Task.CompletedTask;
            
            var middleware = new RequestLoggingMiddleware(next, mockLogger.Object, mockServiceProvider.Object);
            
            // Act
            await middleware.InvokeAsync(httpContext);
            
            // Assert
            var logs = await dbContext.Logs.ToListAsync();
            logs.Should().HaveCount(1);
            logs[0].Priority.Should().Be("high");
            logs[0].Action.Should().Be("created a new task 'Critical Task'");
        }
        
        [Fact]
        public async System.Threading.Tasks.Task InvokeAsync_ForLoginRequest_ExtractsUsernameFromBody()
        {
            // Arrange
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Method = "POST";
            httpContext.Request.Path = "/api/auth/login";
            
            // Setup request body with login info
            string requestBody = @"{""username"":""testuser"",""password"":""password123""}";
            var bytes = Encoding.UTF8.GetBytes(requestBody);
            
            httpContext.Request.Body = new MemoryStream(bytes);
            httpContext.Request.ContentType = "application/json";
            httpContext.Request.ContentLength = bytes.Length;
            
            var mockLogger = new Mock<ILogger<RequestLoggingMiddleware>>();
            
            // Setup DbContext with in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            var dbContext = new ApplicationDbContext(options);
            
            // Setup service provider
            var mockServiceScope = new Mock<IServiceScope>();
            mockServiceScope.Setup(x => x.ServiceProvider).Returns(MockServiceProvider(dbContext).Object);
            
            var mockServiceScopeFactory = new Mock<IServiceScopeFactory>();
            mockServiceScopeFactory
                .Setup(x => x.CreateScope())
                .Returns(mockServiceScope.Object);
            
            var mockServiceProvider = new Mock<IServiceProvider>();
            mockServiceProvider
                .Setup(x => x.GetService(typeof(IServiceScopeFactory)))
                .Returns(mockServiceScopeFactory.Object);
            
            RequestDelegate next = (innerHttpContext) => System.Threading.Tasks.Task.CompletedTask;
            
            var middleware = new RequestLoggingMiddleware(next, mockLogger.Object, mockServiceProvider.Object);
            
            // Act
            await middleware.InvokeAsync(httpContext);
            
            // Assert
            var logs = await dbContext.Logs.ToListAsync();
            logs.Should().HaveCount(1);
            logs[0].User.Should().Be("testuser (login attempt)");
            logs[0].Action.Should().Be("attempted login");
        }
        
        // Helper method to create a mock service provider
        private Mock<IServiceProvider> MockServiceProvider(ApplicationDbContext dbContext)
        {
            var mockServiceProvider = new Mock<IServiceProvider>();
            mockServiceProvider
                .Setup(x => x.GetService(typeof(ApplicationDbContext)))
                .Returns(dbContext);
            return mockServiceProvider;
        }
    }
}