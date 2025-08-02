using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        
        public LogsController(ApplicationDbContext context)
        {
            _context = context;
        }
        
        // GET: api/Logs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LogEntry>>> GetLogs()
        {
            return await _context.Logs
                .OrderByDescending(l => l.Timestamp)
                .Take(1000) // Limit for performance, you can add pagination later
                .ToListAsync();
        }
        
        // GET: api/Logs/highpriority
        [HttpGet("highpriority")]
        public async Task<ActionResult<IEnumerable<LogEntry>>> GetHighPriorityLogs()
        {
            return await _context.Logs
                .Where(l => l.Priority == "high")
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();
        }
        
        // GET: api/Logs/daterange?start=2025-07-01&end=2025-07-31
        [HttpGet("daterange")]
        public async Task<ActionResult<IEnumerable<LogEntry>>> GetLogsByDateRange(
            [FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            return await _context.Logs
                .Where(l => l.Timestamp >= start && l.Timestamp <= end)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();
        }
        
        // Export all logs as CSV
        [HttpGet("export")]
        public async Task<IActionResult> ExportLogs()
        {
            var logs = await _context.Logs
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();
                
            var csv = "Timestamp,User,Method,Endpoint,IP,Priority,Action\n";
            foreach (var log in logs)
            {
                csv += $"{log.Timestamp:yyyy-MM-dd HH:mm:ss},{log.User},{log.Method},{log.Endpoint},{log.IP},{log.Priority},{log.Action}\n";
            }
            
            return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", $"logs-{DateTime.Now:yyyy-MM-dd}.csv");
        }
    }
}