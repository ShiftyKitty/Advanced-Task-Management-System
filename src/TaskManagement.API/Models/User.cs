// Models/User.cs
using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        public required string Username { get; set; }
        
        [Required]
        public required string Email { get; set; }
        
        [Required]
        public required string PasswordHash { get; set; }
        
        public string? Role { get; set; } = "User"; // Default role
    }
}