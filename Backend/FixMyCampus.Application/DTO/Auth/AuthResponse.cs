using FixMyCampus.Domain.Enums;

namespace FixMyCampus.Application.DTO.Auth;

/// <summary>Authenticated user details and a signed bearer token.</summary>
public class AuthResponse
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public string Token { get; set; } = string.Empty;
}