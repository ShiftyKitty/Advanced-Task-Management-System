using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using TaskManagement.API.Services;
using Xunit;

namespace TaskManagement.API.Tests.Services
{
    public class AuthServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<IConfigurationSection> _mockConfigSection;
        private readonly AuthService _authService;
        private readonly string _testSecret = "ThisIsATestSecretKeyThatIsLongEnoughForSecurity";

        public AuthServiceTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);

            // Setup configuration mocks
            _mockConfigSection = new Mock<IConfigurationSection>();
            _mockConfigSection.Setup(s => s.Value).Returns(_testSecret);

            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfiguration.Setup(c => c["JwtSettings:Secret"]).Returns(_testSecret);
            _mockConfiguration.Setup(c => c["JwtSettings:ExpiryInMinutes"]).Returns("60");
            _mockConfiguration.Setup(c => c.GetSection("JwtSettings:Secret")).Returns(_mockConfigSection.Object);

            _authService = new AuthService(_context, _mockConfiguration.Object);

            // Seed the database
            SeedDatabase();
        }

        private void SeedDatabase()
        {
            var existingUser = new User
            {
                Id = 1,
                Username = "existinguser",
                Email = "existing@example.com",
                // This is the hash of "password123" using the SHA256 method in AuthService
                PasswordHash = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
                Role = "User"
            };

            _context.Users.Add(existingUser);
            _context.SaveChanges();
        }

        [Fact]
        public async System.Threading.Tasks.Task Authenticate_WithValidCredentials_ReturnsUser()
        {
            // Arrange
            string username = "existinguser";
            string password = "password123";

            // Act
            var result = await _authService.Authenticate(username, password);

            // Assert
            result.Should().NotBeNull();
            result.Username.Should().Be("existinguser");
        }

        [Fact]
        public async System.Threading.Tasks.Task Authenticate_WithInvalidPassword_ReturnsNull()
        {
            // Arrange
            string username = "existinguser";
            string password = "wrongpassword";

            // Act
            var result = await _authService.Authenticate(username, password);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async System.Threading.Tasks.Task Authenticate_WithNonexistentUser_ReturnsNull()
        {
            // Arrange
            string username = "nonexistentuser";
            string password = "password123";

            // Act
            var result = await _authService.Authenticate(username, password);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async System.Threading.Tasks.Task Register_WithNewUser_CreatesAndReturnsUser()
        {
            // Arrange
            string username = "newuser";
            string email = "new@example.com";
            string password = "password123";

            // Act
            var result = await _authService.Register(username, email, password);

            // Assert
            result.Should().NotBeNull();
            result.Username.Should().Be(username);
            result.Email.Should().Be(email);

            // Verify user was added to database
            var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            userInDb.Should().NotBeNull();
            userInDb.PasswordHash.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async System.Threading.Tasks.Task Register_WithExistingUsername_ReturnsNull()
        {
            // Arrange
            string username = "existinguser"; // Already exists
            string email = "different@example.com";
            string password = "password123";

            // Act
            var result = await _authService.Register(username, email, password);

            // Assert
            result.Should().BeNull();

            // Verify no new user was added
            var usersCount = await _context.Users.CountAsync();
            usersCount.Should().Be(1); // Only the one from seed data
        }

        [Fact]
        public async System.Threading.Tasks.Task Register_WithExistingEmail_ReturnsNull()
        {
            // Arrange
            string username = "differentuser";
            string email = "existing@example.com"; // Already exists
            string password = "password123";

            // Act
            var result = await _authService.Register(username, email, password);

            // Assert
            result.Should().BeNull();

            // Verify no new user was added
            var usersCount = await _context.Users.CountAsync();
            usersCount.Should().Be(1); // Only the one from seed data
        }

        [Fact]
        public void GenerateJwtToken_ReturnsValidToken()
        {
            // Arrange
            var user = new User
            {
                Id = 2,
                Username = "testuser",
                Email = "test@example.com",
                Role = "User",
                PasswordHash = "somehashedpassword"
            };

            // Act
            var token = _authService.GenerateJwtToken(user);

            // Assert
            token.Should().NotBeNullOrEmpty();

            // Decode the token
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);

            // Print claims for debugging
            var claims = jwtToken.Claims.ToList();

            // More flexible verification - find claims by matching values
            claims.Should().Contain(c => c.Value == user.Username);
            claims.Should().Contain(c => c.Value == user.Email);
            claims.Should().Contain(c => c.Value == user.Role);
            claims.Should().Contain(c => c.Value == user.Id.ToString());

            // Verify expiration
            jwtToken.ValidTo.Should().BeAfter(DateTime.UtcNow);
            jwtToken.ValidTo.Should().BeBefore(DateTime.UtcNow.AddMinutes(61)); // Within 60 mins + buffer
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}