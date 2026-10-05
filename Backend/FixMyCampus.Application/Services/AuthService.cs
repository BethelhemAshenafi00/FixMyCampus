using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FixMyCampus.Application.DTO.Auth;
using FixMyCampus.Application.DTOs.Auth;
using FixMyCampus.Application.Interfaces;
using FixMyCampus.Domain.Entities;
using FixMyCampus.Domain.Enums;
using FixMyCampus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FixMyCampus.Application.Services;

/// <summary>Service for user authentication: registration and login with JWT token generation.</summary>
public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    /// <summary>Registers a new user with email and password credentials.</summary>
    public async Task<AuthResponse?> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (existingUser != null)
            return null; // User already exists

        var passwordHash = HashPassword(request.Password);

        var user = new Users
        {
            UserName = request.FullName,
            Email = request.Email,
            PasswordHash = passwordHash,
            UserRole = UserRole.User.ToString()
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            UserId = user.Id,
            FullName = user.UserName,
            Email = user.Email,
            Role = UserRole.User,
            Token = token
        };
    }

    /// <summary>Authenticates a user and returns a JWT token on success.</summary>
    public async Task<AuthResponse?> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (user == null)
            return null; // User not found

        if (!VerifyPassword(user, request.Password))
            return null; // Invalid password

        var token = GenerateJwtToken(user);

        var role = Enum.TryParse<UserRole>(user.UserRole, out var parsedRole)
            ? parsedRole
            : UserRole.User;

        return new AuthResponse
        {
            UserId = user.Id,
            FullName = user.UserName,
            Email = user.Email,
            Role = role,
            Token = token
        };
    }

    /// <summary>Generates a JWT token for the given user.</summary>
    private string GenerateJwtToken(Users user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = jwtSettings["Key"] 
            ?? _configuration["JwtSettings:SecretKey"] 
            ?? "FixMyCampus_SuperSecretKey_2026_AtLeast32BytesLong!";
        var issuer = jwtSettings["Issuer"] 
            ?? _configuration["JwtSettings:Issuer"] 
            ?? "FixMyCampus";
        var audience = jwtSettings["Audience"] 
            ?? _configuration["JwtSettings:Audience"] 
            ?? "FixMyCampus.Client";
        var expirationMinutes = int.TryParse(jwtSettings["ExpirationMinutes"] ?? _configuration["JwtSettings:ExpirationMinutes"], out var exp) 
            ? exp 
            : 1440;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var userRoleStr = user.UserRole ?? UserRole.User.ToString();

        var claims = new[]
        {
            new Claim("sub", user.Id.ToString()),
            new Claim("email", user.Email),
            new Claim("name", user.UserName ?? user.Email),
            new Claim("role", userRoleStr),
            new Claim(ClaimTypes.Role, userRoleStr),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>Hashes a password using PBKDF2 with SHA256.</summary>
    private string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            10000,
            HashAlgorithmName.SHA256,
            20);

        var hashWithSalt = new byte[36];
        Array.Copy(salt, 0, hashWithSalt, 0, 16);
        Array.Copy(hash, 0, hashWithSalt, 16, 20);
        return Convert.ToBase64String(hashWithSalt);
    }

    /// <summary>Verifies a password against various hash schemes for compatibility.</summary>
    private bool VerifyPassword(Users user, string password)
    {
        if (string.IsNullOrEmpty(user.PasswordHash))
            return false;

        // 1. PBKDF2 hash (16-byte salt + 20-byte hash = 36 bytes = 48 chars Base64)
        try
        {
            var hashWithSalt = Convert.FromBase64String(user.PasswordHash);
            if (hashWithSalt.Length == 36)
            {
                var salt = new byte[16];
                Array.Copy(hashWithSalt, 0, salt, 0, 16);

                var computedHash = Rfc2898DeriveBytes.Pbkdf2(
                    Encoding.UTF8.GetBytes(password),
                    salt,
                    10000,
                    HashAlgorithmName.SHA256,
                    20);

                if (CryptographicOperations.FixedTimeEquals(computedHash, hashWithSalt.AsSpan(16, 20)))
                {
                    return true;
                }
            }
        }
        catch
        {
            // Not a base64 salt+hash
        }

        // 2. Plain text match for testing
        if (string.Equals(user.PasswordHash, password, StringComparison.Ordinal))
        {
            return true;
        }

        return false;
    }
}
