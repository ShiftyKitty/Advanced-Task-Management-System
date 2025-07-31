using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskManagement.API.Data;
using TaskManagement.API.Events;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TasksController> _logger;
        private readonly TaskEventService _taskEventService;
        
        public TasksController(
            ApplicationDbContext context, 
            ILogger<TasksController> logger,
            TaskEventService taskEventService)
        {
            _context = context;
            _logger = logger;
            _taskEventService = taskEventService;
        }
        
        // GET: api/Tasks
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Models.Task>>> GetTasks()
        {
            return await _context.Tasks.ToListAsync();
        }
        
        // GET: api/Tasks/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Models.Task>> GetTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            
            if (task == null)
            {
                return NotFound();
            }
            
            return task;
        }
        
        // PUT: api/Tasks/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTask(int id, Models.Task task)
        {
            if (id != task.Id)
            {
                return BadRequest();
            }
            
            // Check if this is a high-priority task update
            var existingTask = await _context.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
            bool isHighPriorityUpdate = task.Priority == Priority.High && 
                                       (existingTask == null || existingTask.Priority != Priority.High);
            
            _context.Entry(task).State = EntityState.Modified;
            
            try
            {
                await _context.SaveChangesAsync();
                
                // Trigger high priority event if needed
                if (isHighPriorityUpdate)
                {
                    _taskEventService.TriggerHighPriorityEvent(task, "updated", User.Identity?.Name);
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TaskExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            
            return NoContent();
        }
        
        // POST: api/Tasks
        [HttpPost]
        public async Task<ActionResult<Models.Task>> PostTask(Models.Task task)
        {
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            
            // Trigger high priority event if needed
            if (task.Priority == Priority.High)
            {
                _taskEventService.TriggerHighPriorityEvent(task, "created", User.Identity?.Name);
            }
            
            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
        }
        
        // DELETE: api/Tasks/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound();
            }
            
            // Store task info before removal for potential event
            var removedTask = task;
            var wasHighPriority = task.Priority == Priority.High;
            
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            
            // Trigger event if high priority task was deleted
            if (wasHighPriority)
            {
                _taskEventService.TriggerHighPriorityEvent(removedTask, "deleted", User.Identity?.Name);
            }
            
            return NoContent();
        }
        
        private bool TaskExists(int id)
        {
            return _context.Tasks.Any(e => e.Id == id);
        }
    }
}