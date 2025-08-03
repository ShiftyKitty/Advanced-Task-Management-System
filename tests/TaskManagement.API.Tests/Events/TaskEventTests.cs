using System;
using System.IO;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TaskManagement.API.Events;
using TaskManagement.API.Models;
using Xunit;

namespace TaskManagement.API.Tests.Events
{
    public class TaskEventTests
    {
        private readonly Mock<ILogger<TaskEventService>> _mockLogger;
        
        public TaskEventTests()
        {
            _mockLogger = new Mock<ILogger<TaskEventService>>();
        }
        
        [Fact]
        public void TriggerHighPriorityEvent_WithHighPriorityTask_RaisesEvent()
        {
            // Arrange
            var taskEventService = new TaskEventService(_mockLogger.Object);
            
            bool eventWasRaised = false;
            TaskEventArgs? capturedArgs = null;
            
            taskEventService.HighPriorityTaskEvent += (sender, args) => {
                eventWasRaised = true;
                capturedArgs = args;
            };
            
            var highPriorityTask = new Models.Task
            {
                Id = 1,
                Title = "Critical Task",
                Description = "Important task",
                Priority = Priority.High,
                Status = Status.Pending,
                DueDate = DateTime.Now.AddDays(1)
            };
            
            string action = "created";
            string username = "testuser";
            
            // Act
            taskEventService.TriggerHighPriorityEvent(highPriorityTask, action, username);
            
            // Assert
            eventWasRaised.Should().BeTrue("Event should be raised for high priority tasks");
            capturedArgs.Should().NotBeNull();
            capturedArgs!.Task.Should().Be(highPriorityTask);
            capturedArgs.Action.Should().Be(action);
            capturedArgs.Username.Should().Be(username);
        }
        
        [Fact]
        public void TriggerHighPriorityEvent_WithMediumPriorityTask_DoesNotRaiseEvent()
        {
            // Arrange
            var taskEventService = new TaskEventService(_mockLogger.Object);
            
            bool eventWasRaised = false;
            
            taskEventService.HighPriorityTaskEvent += (sender, args) => {
                eventWasRaised = true;
            };
            
            var mediumPriorityTask = new Models.Task
            {
                Id = 2,
                Title = "Normal Task",
                Description = "Regular task",
                Priority = Priority.Medium,
                Status = Status.Pending,
                DueDate = DateTime.Now.AddDays(1)
            };
            
            // Act
            taskEventService.TriggerHighPriorityEvent(mediumPriorityTask, "updated", "testuser");
            
            // Assert
            eventWasRaised.Should().BeFalse("Event should not be raised for medium priority tasks");
        }
        
        [Fact]
        public void TriggerHighPriorityEvent_WithLowPriorityTask_DoesNotRaiseEvent()
        {
            // Arrange
            var taskEventService = new TaskEventService(_mockLogger.Object);
            
            bool eventWasRaised = false;
            
            taskEventService.HighPriorityTaskEvent += (sender, args) => {
                eventWasRaised = true;
            };
            
            var lowPriorityTask = new Models.Task
            {
                Id = 3,
                Title = "Low Priority Task",
                Description = "Not important task",
                Priority = Priority.Low,
                Status = Status.Pending,
                DueDate = DateTime.Now.AddDays(7)
            };
            
            // Act
            taskEventService.TriggerHighPriorityEvent(lowPriorityTask, "updated", "testuser");
            
            // Assert
            eventWasRaised.Should().BeFalse("Event should not be raised for low priority tasks");
        }
        
        [Fact]
        public void OnHighPriorityTaskEvent_LogsMessage()
        {
            // Arrange
            var taskEventService = new TaskEventService(_mockLogger.Object);
            
            var highPriorityTask = new Models.Task
            {
                Id = 1,
                Title = "Critical Task",
                Description = "Important task",
                Priority = Priority.High,
                Status = Status.Pending,
                DueDate = DateTime.Now.AddDays(1)
            };
            
            // Act
            taskEventService.TriggerHighPriorityEvent(highPriorityTask, "created", "testuser");
            
            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("[HIGH PRIORITY]") && 
                                                 v.ToString().Contains("testuser") && 
                                                 v.ToString().Contains("created") && 
                                                 v.ToString().Contains("Critical Task")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }
        
        [Fact]
        public void TriggerHighPriorityEvent_WithNullUsername_UsesDefaultUsername()
        {
            // Arrange
            var taskEventService = new TaskEventService(_mockLogger.Object);
            
            TaskEventArgs? capturedArgs = null;
            
            taskEventService.HighPriorityTaskEvent += (sender, args) => {
                capturedArgs = args;
            };
            
            var highPriorityTask = new Models.Task
            {
                Id = 1,
                Title = "Critical Task",
                Description = "Important task",
                Priority = Priority.High,
                Status = Status.Pending,
                DueDate = DateTime.Now.AddDays(1)
            };
            
            // Act - pass null for username
            taskEventService.TriggerHighPriorityEvent(highPriorityTask, "created", null);
            
            // Assert
            capturedArgs.Should().NotBeNull();
            capturedArgs!.Username.Should().Be("system", "Default username should be 'system' when null is provided");
        }
    }
}