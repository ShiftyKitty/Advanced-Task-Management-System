using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using TaskManagement.API.Controllers;
using TaskManagement.API.Models;
using TaskManagement.API.Services;
using Xunit;

namespace TaskManagement.API.Tests.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _mockAuthService;
        private readonly AuthController _controller;
        
        public AuthControllerTests()
        {
            // Create mock of the interface instead of concrete class
            _mockAuthService = new Mock<IAuthService>();
            _controller = new AuthController(_mockAuthService.Object);
        }
        
        [Fact]
        public async System.Threading.Tasks.Task Login_WithValidCredentials_ReturnsOkWithToken()
        {
            // Arrange
            var loginRequest = new LoginRequest 
            { 
                Username = "testuser", 
                Password = "password123" 
            };
            
            var user = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                Role = "User",
                PasswordHash = "hashed_password"
            };
            
            _mockAuthService.Setup(x => x.Authenticate(loginRequest.Username, loginRequest.Password))
                .ReturnsAsync(user);
            
            _mockAuthService.Setup(x => x.GenerateJwtToken(user))
                .Returns("test-jwt-token");
            
            // Act
            var result = await _controller.Login(loginRequest);
            
            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().NotBeNull();
            
            // Convert to JObject for easier property access
            var responseJson = JsonConvert.SerializeObject(okResult.Value);
            var responseObj = JObject.Parse(responseJson);
            
            // Check properties using string keys
            responseObj.Value<int>("Id").Should().Be(user.Id);
            responseObj.Value<string>("Username").Should().Be(user.Username);
            responseObj.Value<string>("Email").Should().Be(user.Email);
            responseObj.Value<string>("Role").Should().Be(user.Role);
            responseObj.Value<string>("Token").Should().Be("test-jwt-token");
        }
        
        [Fact]
        public async System.Threading.Tasks.Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var loginRequest = new LoginRequest 
            { 
                Username = "testuser", 
                Password = "wrongpassword" 
            };
            
            _mockAuthService.Setup(x => x.Authenticate(loginRequest.Username, loginRequest.Password))
                .ReturnsAsync((User?)null);
            
            // Act
            var result = await _controller.Login(loginRequest);
            
            // Assert
            var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
            unauthorizedResult.Value.Should().NotBeNull();
            
            // Convert to JObject for easier property access
            var responseJson = JsonConvert.SerializeObject(unauthorizedResult.Value);
            var responseObj = JObject.Parse(responseJson);
            
            // The property name might be 'message' or 'Message'
            responseObj.Should().ContainAnyOf(
                new[] { 
                    new JProperty("message", "Username or password is incorrect"),
                    new JProperty("Message", "Username or password is incorrect")
                }
            );
        }
        
        [Fact]
        public async System.Threading.Tasks.Task Register_WithValidData_ReturnsOkWithToken()
        {
            // Arrange
            var registerRequest = new RegisterRequest 
            { 
                Username = "newuser", 
                Email = "new@example.com",
                Password = "password123"
            };
            
            var user = new User
            {
                Id = 1,
                Username = "newuser",
                Email = "new@example.com",
                Role = "User",
                PasswordHash = "hashed_password"
            };
            
            _mockAuthService.Setup(x => x.Register(registerRequest.Username, registerRequest.Email, registerRequest.Password))
                .ReturnsAsync(user);
            
            _mockAuthService.Setup(x => x.GenerateJwtToken(user))
                .Returns("test-jwt-token");
            
            // Act
            var result = await _controller.Register(registerRequest);
            
            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().NotBeNull();
            
            // Convert to JObject for easier property access
            var responseJson = JsonConvert.SerializeObject(okResult.Value);
            var responseObj = JObject.Parse(responseJson);
            
            // Check properties using string keys
            responseObj.Value<int>("Id").Should().Be(user.Id);
            responseObj.Value<string>("Username").Should().Be(user.Username);
            responseObj.Value<string>("Email").Should().Be(user.Email);
            responseObj.Value<string>("Role").Should().Be(user.Role);
            responseObj.Value<string>("Token").Should().Be("test-jwt-token");
        }
        
        [Fact]
        public async System.Threading.Tasks.Task Register_WithMissingFields_ReturnsBadRequest()
        {
            // Arrange
            var registerRequest = new RegisterRequest 
            { 
                Username = "", 
                Email = "new@example.com",
                Password = "password123"
            };
            
            // Act
            var result = await _controller.Register(registerRequest);
            
            // Assert
            var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequestResult.Value.Should().NotBeNull();
            
            // Convert to JObject for easier property access
            var responseJson = JsonConvert.SerializeObject(badRequestResult.Value);
            var responseObj = JObject.Parse(responseJson);
            
            // The property name might be 'message' or 'Message'
            responseObj.Should().ContainAnyOf(
                new[] { 
                    new JProperty("message", "Username and password are required"),
                    new JProperty("Message", "Username and password are required")
                }
            );
        }
        
        [Fact]
        public async System.Threading.Tasks.Task Register_WithExistingUsername_ReturnsBadRequest()
        {
            // Arrange
            var registerRequest = new RegisterRequest 
            { 
                Username = "existinguser", 
                Email = "new@example.com",
                Password = "password123"
            };
            
            _mockAuthService.Setup(x => x.Register(registerRequest.Username, registerRequest.Email, registerRequest.Password))
                .ReturnsAsync((User?)null);
            
            // Act
            var result = await _controller.Register(registerRequest);
            
            // Assert
            var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequestResult.Value.Should().NotBeNull();
            
            // Convert to JObject for easier property access
            var responseJson = JsonConvert.SerializeObject(badRequestResult.Value);
            var responseObj = JObject.Parse(responseJson);
            
            // The property name might be 'message' or 'Message'
            responseObj.Should().ContainAnyOf(
                new[] { 
                    new JProperty("message", "Username or email is already taken"),
                    new JProperty("Message", "Username or email is already taken")
                }
            );
        }
    }
}