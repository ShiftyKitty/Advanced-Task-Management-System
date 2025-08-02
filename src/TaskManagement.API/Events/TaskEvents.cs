using System;
using System.IO;
using Microsoft.Extensions.Logging;
using TaskManagement.API.Models;

namespace TaskManagement.API.Events
{
    public class TaskEventArgs : EventArgs
    {
        public Models.Task Task { get; }
        public string Action { get; }
        public string Username { get; }

        public TaskEventArgs(Models.Task task, string action, string? username)
        {
            Task = task;
            Action = action;
            Username = username ?? "system"; // Default value if username is null
        }
    }

    public class TaskEventService : ITaskEventService
    {
        private readonly ILogger<TaskEventService> _logger;

        public event EventHandler<TaskEventArgs>? HighPriorityTaskEvent;

        public TaskEventService(ILogger<TaskEventService> logger)
        {
            _logger = logger;
            
            // Subscribe to the event
            HighPriorityTaskEvent += OnHighPriorityTaskEvent;
        }

        public void TriggerHighPriorityEvent(Models.Task task, string action, string? username = null)
        {
            if (task.Priority == Priority.High)
            {
                HighPriorityTaskEvent?.Invoke(this, new TaskEventArgs(task, action, username));
            }
        }

        private void OnHighPriorityTaskEvent(object? sender, TaskEventArgs e)
        {
            var message = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} - [HIGH PRIORITY] - User '{e.Username}' {e.Action} task '{e.Task.Title}'";
            
            // Log to console
            _logger.LogWarning(message);
            
            // Log to critical updates file
            string logFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "critical_updates.log");
            File.AppendAllText(logFilePath, message + Environment.NewLine);
        }
    }
}