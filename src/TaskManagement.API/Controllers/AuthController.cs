using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }
        
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            var user = await _authService.Authenticate(model.Username, model.Password);
            
            if (user == null)
                return Unauthorized(new { message = "Username or password is incorrect" });
                
            var token = _authService.GenerateJwtToken(user);
            
            return Ok(new 
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                Token = token
            });
        }
        
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest model)
        {
            // Validate request
            if (string.IsNullOrEmpty(model.Username) || string.IsNullOrEmpty(model.Password))
                return BadRequest(new { message = "Username and password are required" });
                
            // Register user
            var user = await _authService.Register(model.Username, model.Email, model.Password);
            
            if (user == null)
                return BadRequest(new { message = "Username or email is already taken" });
                
            // Generate JWT token
            var token = _authService.GenerateJwtToken(user);
            
            return Ok(new 
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                Token = token
            });
        }
    }
    
    public class LoginRequest
    {
        public required string Username { get; set; }
        public required string Password { get; set; }
    }
    
    public class RegisterRequest
    {
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}