// Services/AuthService.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public class AuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<User?> Authenticate(string username, string password)
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return null;

            // For simplicity, we're comparing hashed passwords directly
            // In a real app, use a proper password hasher with salt
            if (VerifyPassword(password, user.PasswordHash))
                return user;

            return null;
        }

        public async Task<User?> Register(string username, string email, string password)
        {
            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Username == username || u.Email == email))
                return null;

            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = HashPassword(password),
                Role = "User" // Default role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }

        public string GenerateJwtToken(User user)
        {
            // Generate token that is valid for 7 days
            var tokenHandler = new JwtSecurityTokenHandler();

            // Make sure the key is at least 32 bytes (256 bits) long
            var key = Encoding.ASCII.GetBytes(_configuration["JwtSettings:Secret"] ?? "TaskMaster5000_HelloThere!#2025_SECURE");

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role ?? "User"),
            new Claim("id", user.Id.ToString())
        }),
                Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:ExpiryInMinutes"] ?? "60")),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        // Simple password hashing for demo purposes
        // In a real app, use a proper password hasher like BCrypt
        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            // Convert to hex string
            return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            return HashPassword(password) == storedHash;
        }
    }
}