using System;
using TaskManagement.API.Models;

namespace TaskManagement.API.Events
{
    public interface ITaskEventService
    {
        event EventHandler<TaskEventArgs>? HighPriorityTaskEvent;
        void TriggerHighPriorityEvent(Models.Task task, string action, string? username = null);
    }
}