using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Models;
using System;

namespace TaskManagement.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        
        public DbSet<Models.Task> Tasks { get; set; }
        public DbSet<LogEntry> Logs { get; set; } // Add this line for the logs table
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Seed data for Tasks
            modelBuilder.Entity<Models.Task>().HasData(
                new Models.Task 
                { 
                    Id = 1, 
                    Title = "Deploy new version of the application",
                    Description = "Update the system to version 2.0 with all the new features",
                    Priority = Priority.High,
                    DueDate = new DateTime(2025, 8, 15),
                    Status = Status.Pending
                },
                new Models.Task 
                { 
                    Id = 2, 
                    Title = "Update API documentation",
                    Description = "Complete the updated API documentation for version 2.0",
                    Priority = Priority.Medium,
                    DueDate = new DateTime(2025, 8, 4),
                    Status = Status.InProgress
                },
                new Models.Task 
                { 
                    Id = 3, 
                    Title = "Research new libraries",
                    Description = "Investigate new libraries for potential inclusion in the project",
                    Priority = Priority.Low,
                    DueDate = new DateTime(2025, 7, 28),
                    Status = Status.Completed
                }
            );
        }
    }
}