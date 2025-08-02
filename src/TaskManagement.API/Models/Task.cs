using System;
using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.Models
{
    public class Task
    {
        public int Id { get; set; }
        
        [Required]
        public required string Title { get; set; }
        
        public string? Description { get; set; }
        
        [Required]
        public Priority Priority { get; set; }
        
        public DateTime DueDate { get; set; }
        
        [Required]
        public Status Status { get; set; }
        
        // Add User association
        public int? UserId { get; set; }
        public User? User { get; set; }
    }
    
    public enum Priority
    {
        Low,
        Medium,
        High
    }
    
    public enum Status
    {
        Pending,
        InProgress,
        Completed,
        Archived
    }
}