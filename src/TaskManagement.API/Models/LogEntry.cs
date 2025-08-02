// In Models/LogEntry.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.Models
{
    public class LogEntry
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        
        [Required]
        public required string User { get; set; }
        
        [Required]
        public required string Method { get; set; }
        
        [Required]
        public required string Endpoint { get; set; }
        
        [Required]
        public required string IP { get; set; }
        
        [Required]
        public required string Priority { get; set; } // "high" or "normal"
        
        [Required]
        public required string Action { get; set; }
    }
}