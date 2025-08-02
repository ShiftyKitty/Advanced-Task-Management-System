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
        public DbSet<LogEntry> Logs { get; set; }
        public DbSet<User> Users { get; set; }

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
                    Status = Status.Pending,
                    UserId = 1 // Admin user
                },
                new Models.Task
                {
                    Id = 2,
                    Title = "Update API documentation",
                    Description = "Complete the updated API documentation for version 2.0",
                    Priority = Priority.Medium,
                    DueDate = new DateTime(2025, 8, 4),
                    Status = Status.InProgress,
                    UserId = 1 // Admin user
                },
                new Models.Task
                {
                    Id = 3,
                    Title = "Research new libraries",
                    Description = "Investigate new libraries for potential inclusion in the project",
                    Priority = Priority.Low,
                    DueDate = new DateTime(2025, 7, 28),
                    Status = Status.Completed,
                    UserId = 1 // Admin user
                }
            );

            // Seed admin user
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Username = "admin",
                    Email = "admin@example.com",
                    // SHA256 hash of "admin123"
                    // Generated from https://sha-generator.com/
                    // In real life, use a proper password hasher
                    PasswordHash = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
                    Role = "Admin"
                }
            );
        }
    }
}