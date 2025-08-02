using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using TaskManagement.API.Controllers;
using TaskManagement.API.Data;
using TaskManagement.API.Events;
using TaskManagement.API.Models;
using Xunit;

namespace TaskManagement.API.Tests.Controllers
{
    public class TasksControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<ILogger<TasksController>> _mockLogger;
        private readonly Mock<ITaskEventService> _mockTaskEventService;
        private readonly TasksController _controller;
        
        public TasksControllerTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            _context = new ApplicationDbContext(options);
            _mockLogger = new Mock<ILogger<TasksController>>();
            
            // Use the interface instead of the concrete class
            _mockTaskEventService = new Mock<ITaskEventService>();
            
            _controller = new TasksController(_context, _mockLogger.Object, _mockTaskEventService.Object);
            
            // Seed the database
            SeedDatabase();
        }
        
        private void SeedDatabase()
        {
            // Add test users
            var adminUser = new User 
            { 
                Id = 1, 
                Username = "admin", 
                Email = "admin@example.com",
                PasswordHash = "hash" 
            };
            
            var regularUser = new User 
            { 
                Id = 2, 
                Username = "user", 
                Email = "user@example.com", 
                PasswordHash = "hash" 
            };
            
            _context.Users.Add(adminUser);
            _context.Users.Add(regularUser);
            
            // Add test tasks - use fully qualified name to avoid ambiguity
            _context.Tasks.AddRange(
                new TaskManagement.API.Models.Task
                {
                    Id = 1,
                    Title = "Admin Task",
                    Description = "Task for admin",
                    Priority = Priority.Low,
                    Status = Status.Pending,
                    DueDate = DateTime.Now.AddDays(1),
                    UserId = 1 // Admin user
                },
                new TaskManagement.API.Models.Task
                {
                    Id = 2,
                    Title = "User Task",
                    Description = "Task for regular user",
                    Priority = Priority.Medium,
                    Status = Status.InProgress,
                    DueDate = DateTime.Now.AddDays(2),
                    UserId = 2 // Regular user
                },
                new TaskManagement.API.Models.Task
                {
                    Id = 3,
                    Title = "High Priority Task",
                    Description = "Critical task",
                    Priority = Priority.High,
                    Status = Status.Pending,
                    DueDate = DateTime.Now,
                    UserId = 2 // Regular user
                }
            );
            
            _context.SaveChanges();
        }
        
        private void SetupUserContext(int userId, bool isAdmin = false)
        {
            // Create claims for the user
            var claims = new List<Claim>
            {
                new Claim("id", userId.ToString()),
                new Claim(ClaimTypes.Name, userId == 1 ? "admin" : "user")
            };
            
            if (isAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }
            
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            
            // Set up controller context
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }
        
        [Fact]
        public async System.Threading.Tasks.Task GetTasks_AsAdmin_ReturnsAllTasks()
        {
            // Arrange
            SetupUserContext(1, isAdmin: true);
            
            // Act
            var result = await _controller.GetTasks();
            
            // Assert - adjusted for actual return type
            result.Value.Should().NotBeNull();
            var tasks = result.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject;
            tasks.Should().HaveCount(3); // Admin sees all tasks
        }
        
        [Fact]
        public async System.Threading.Tasks.Task GetTasks_AsRegularUser_ReturnsOnlyUserTasks()
        {
            // Arrange
            SetupUserContext(2);
            
            // Act
            var result = await _controller.GetTasks();
            
            // Assert - adjusted for actual return type
            result.Value.Should().NotBeNull();
            var tasks = result.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject;
            tasks.Should().HaveCount(2); // Regular user sees only their tasks (ID 2 and 3)
        }
        
        [Fact]
        public async System.Threading.Tasks.Task GetTask_AsAdmin_CanAccessAnyTask()
        {
            // Arrange
            SetupUserContext(1, isAdmin: true);
            
            // Act - access a task that belongs to another user
            var result = await _controller.GetTask(2);
            
            // Assert - adjusted for actual return type
            result.Value.Should().NotBeNull();
            // For successful access, we shouldn't get a ForbidResult
            result.Result.Should().BeNull();
        }
        
        [Fact]
        public async System.Threading.Tasks.Task GetTask_AsRegularUser_CannotAccessOtherUserTask()
        {
            // Arrange
            SetupUserContext(2);
            
            // Act - try to access admin's task
            var result = await _controller.GetTask(1);
            
            // Assert
            result.Result.Should().BeOfType<ForbidResult>();
        }
        
        [Fact]
        public async System.Threading.Tasks.Task PostTask_WithHighPriority_TriggersEvent()
        {
            // Arrange
            SetupUserContext(2);
            var newTask = new TaskManagement.API.Models.Task
            {
                Title = "New High Priority Task",
                Description = "Test task",
                Priority = Priority.High,
                Status = Status.Pending,
                DueDate = DateTime.Now.AddDays(1)
            };
            
            // Act
            var result = await _controller.PostTask(newTask);
            
            // Assert - now using interface
            _mockTaskEventService.Verify(
                x => x.TriggerHighPriorityEvent(
                    It.IsAny<TaskManagement.API.Models.Task>(),
                    It.Is<string>(s => s == "created"),
                    It.IsAny<string>()),
                Times.Once);
        }
        
        [Fact]
        public async System.Threading.Tasks.Task PutTask_UpdateToHighPriority_TriggersEvent()
        {
            // Arrange
            SetupUserContext(2);
            var taskToUpdate = await _context.Tasks.FindAsync(2);
            if (taskToUpdate != null) // Fix null reference warning
            {
                taskToUpdate.Priority = Priority.High;
                
                // Act
                var result = await _controller.PutTask(2, taskToUpdate);
                
                // Assert - now using interface
                _mockTaskEventService.Verify(
                    x => x.TriggerHighPriorityEvent(
                        It.IsAny<TaskManagement.API.Models.Task>(),
                        It.Is<string>(s => s == "updated"),
                        It.IsAny<string>()),
                    Times.Once);
            }
        }
        
        [Fact]
        public async System.Threading.Tasks.Task DeleteTask_HighPriorityTask_TriggersEvent()
        {
            // Arrange
            SetupUserContext(2);
            
            // Act - delete a high priority task (ID 3)
            var result = await _controller.DeleteTask(3);
            
            // Assert - now using interface
            _mockTaskEventService.Verify(
                x => x.TriggerHighPriorityEvent(
                    It.IsAny<TaskManagement.API.Models.Task>(),
                    It.Is<string>(s => s == "deleted"),
                    It.IsAny<string>()),
                Times.Once);
        }
        
        [Fact]
        public async System.Threading.Tasks.Task DeleteTask_AsRegularUser_CannotDeleteOtherUserTask()
        {
            // Arrange
            SetupUserContext(2);
            
            // Act - try to delete admin's task
            var result = await _controller.DeleteTask(1);
            
            // Assert
            result.Should().BeOfType<ForbidResult>();
        }
        
        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}