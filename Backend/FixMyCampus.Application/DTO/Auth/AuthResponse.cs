namespace FixMyCampus.Application.DTO.Auth;

public class AuthResponse
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public string Token { get; set; } = string.Empty;
}