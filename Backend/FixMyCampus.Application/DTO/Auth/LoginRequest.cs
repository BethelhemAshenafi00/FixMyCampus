using System.ComponentModel.DataAnnotations;

namespace FixMyCampus.Application.DTOs.Auth;

/// <summary>Credentials used to authenticate an account.</summary>
public class LoginRequest
{
    [Required, EmailAddress, StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(128)]
    public string Password { get; set; } = string.Empty;
}