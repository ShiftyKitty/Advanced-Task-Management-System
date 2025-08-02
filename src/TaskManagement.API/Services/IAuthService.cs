using System.Threading.Tasks;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public interface IAuthService
    {
        Task<User?> Authenticate(string username, string password);
        Task<User?> Register(string username, string email, string password);
        string GenerateJwtToken(User user);
    }
}