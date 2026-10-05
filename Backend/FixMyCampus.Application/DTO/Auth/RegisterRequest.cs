using System.ComponentModel.DataAnnotations;

namespace FixMyCampus.Application.DTOs.Auth;

/// <summary>Credentials and profile details used to create an account.</summary>
public class RegisterRequest
{
    [Required, StringLength(200, MinimumLength = 1)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), StringLength(128)]
    public string Password { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Department { get; set; }
}