using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using TaskManagement.API.Controllers;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using Xunit;

namespace TaskManagement.API.Tests.Controllers
{
    public class LogsControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly LogsController _controller;

        public LogsControllerTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _controller = new LogsController(_context);

            // Seed the database with test logs
            SeedDatabase();
        }

        private void SeedDatabase()
        {
            // Add test logs
            var logs = new List<LogEntry>
            {
                new LogEntry
                {
                    Id = 1,
                    Timestamp = DateTime.Now.AddDays(-1),
                    User = "admin",
                    Method = "GET",
                    Endpoint = "/api/tasks",
                    IP = "127.0.0.1",
                    Priority = "normal",
                    Action = "Retrieved tasks"
                },
                new LogEntry
                {
                    Id = 2,
                    Timestamp = DateTime.Now.AddDays(-2),
                    User = "john_dev",
                    Method = "POST",
                    Endpoint = "/api/tasks",
                    IP = "192.168.1.105",
                    Priority = "high",
                    Action = "Created high priority task"
                },
                new LogEntry
                {
                    Id = 3,
                    Timestamp = DateTime.Now.AddDays(-3),
                    User = "sarah_pm",
                    Method = "PUT",
                    Endpoint = "/api/tasks/5",
                    IP = "192.168.1.107",
                    Priority = "normal",
                    Action = "Updated task status"
                },
                new LogEntry
                {
                    Id = 4,
                    Timestamp = DateTime.Now.AddDays(-10),
                    User = "john_dev",
                    Method = "DELETE",
                    Endpoint = "/api/tasks/3",
                    IP = "192.168.1.105",
                    Priority = "high",
                    Action = "Deleted high priority task"
                }
            };

            _context.Logs.AddRange(logs);
            _context.SaveChanges();
        }

        private void SetupUserContext(string role = "User")
        {
            // Create claims for the user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, "testuser"),
                new Claim(ClaimTypes.Role, role)
            };

            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);

            // Set up controller context
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        [Fact]
        public async System.Threading.Tasks.Task GetLogs_AsAdmin_ReturnsAllLogs()
        {
            // Arrange
            SetupUserContext("Admin");

            // Act
            var result = await _controller.GetLogs();

            // Assert
            result.Value.Should().NotBeNull();
            var logs = result.Value.Should().BeAssignableTo<IEnumerable<LogEntry>>().Subject;
            logs.Should().HaveCount(4);
            logs.Should().BeInDescendingOrder(l => l.Timestamp);
        }

        [Fact]
        public async System.Threading.Tasks.Task GetHighPriorityLogs_AsAdmin_ReturnsOnlyHighPriorityLogs()
        {
            // Arrange
            SetupUserContext("Admin");

            // Act
            var result = await _controller.GetHighPriorityLogs();

            // Assert
            result.Value.Should().NotBeNull();
            var logs = result.Value.Should().BeAssignableTo<IEnumerable<LogEntry>>().Subject;
            logs.Should().HaveCount(2);
            logs.Should().AllSatisfy(log => log.Priority.Should().Be("high"));
            logs.Should().BeInDescendingOrder(l => l.Timestamp);
        }

        [Fact]
        public async System.Threading.Tasks.Task GetLogsByDateRange_AsAdmin_ReturnsLogsInRange()
        {
            // Arrange
            SetupUserContext("Admin");
            var startDate = DateTime.Now.AddDays(-3).Date; // Use Date property to set time to 00:00:00
            var endDate = DateTime.Now;
            
            // Act
            var result = await _controller.GetLogsByDateRange(startDate, endDate);
            
            // Assert
            result.Value.Should().NotBeNull();
            var logs = result.Value.Should().BeAssignableTo<IEnumerable<LogEntry>>().Subject;
            logs.Should().HaveCount(3); // Expecting 3 logs within the last 3 days
            logs.Should().AllSatisfy(log =>
                log.Timestamp.Should().BeOnOrAfter(startDate).And.BeOnOrBefore(endDate));
            logs.Should().BeInDescendingOrder(l => l.Timestamp);
        }

        [Fact]
        public async System.Threading.Tasks.Task ExportLogs_AsAdmin_ReturnsCSVFile()
        {
            // Arrange
            SetupUserContext("Admin");

            // Act
            var result = await _controller.ExportLogs();

            // Assert
            var fileResult = result.Should().BeOfType<FileContentResult>().Subject;
            fileResult.ContentType.Should().Be("text/csv");
            fileResult.FileDownloadName.Should().StartWith("logs-").And.EndWith(".csv");

            // Verify CSV content
            var content = Encoding.UTF8.GetString(fileResult.FileContents);
            content.Should().StartWith("Timestamp,User,Method,Endpoint,IP,Priority,Action");
            var rows = content.Split('\n');
            rows.Length.Should().BeGreaterThan(4); // Header + 4 logs
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}