using System.IdentityModel.Tokens.Jwt;
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
        // Check if email already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (existingUser != null)
            return null; // User already exists

        // Default new users to "User" role (Reporter)
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
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user == null)
            return null; // User not found

        if (!VerifyPassword(request.Password, user.PasswordHash))
            return null; // Invalid password

        var token = GenerateJwtToken(user);

        // Parse user role from string
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
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"];
        var issuer = jwtSettings["Issuer"];
        var audience = jwtSettings["Audience"];
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

        if (string.IsNullOrEmpty(secretKey))
            throw new InvalidOperationException("JWT secret key not configured");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new System.Security.Claims.Claim("sub", user.Id.ToString()),
            new System.Security.Claims.Claim("email", user.Email),
            new System.Security.Claims.Claim("name", user.UserName),
            new System.Security.Claims.Claim("role", user.UserRole)
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

    /// <summary>Hashes a password using PBKDF2.</summary>
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

    /// <summary>Verifies a password against its hash.</summary>
    private bool VerifyPassword(string password, string hash)
    {
        var hashWithSalt = Convert.FromBase64String(hash);
        var salt = new byte[16];
        Array.Copy(hashWithSalt, 0, salt, 0, 16);

        var computedHash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            10000,
            HashAlgorithmName.SHA256,
            20);

        for (var i = 0; i < 20; i++)
        {
            if (hashWithSalt[i + 16] != computedHash[i])
                return false;
        }

        return true;
    }
}
