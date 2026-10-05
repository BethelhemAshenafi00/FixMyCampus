using FixMyCampus.Application.DTO.Auth;
using FixMyCampus.Application.DTOs.Auth;

namespace FixMyCampus.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken);

    Task<AuthResponse?> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken);
}