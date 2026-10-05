using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FixMyCampus.Application.DTO.Auth;
using FixMyCampus.Application.DTOs.Auth;
using FixMyCampus.Domain.Entities;
using FixMyCampus.Domain.Enums;
using FixMyCampus.Application.Interfaces;
using FixMyCampus.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace FixMyCampus.Api.Services;

public sealed class AuthService(
    AppDbContext dbContext,
    IPasswordHasher<Users> passwordHasher,
    IOptions<JwtSettings> jwtSettings) : IAuthService
{
    private readonly JwtSettings _jwt = jwtSettings.Value;

    public async Task<AuthResponse?> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        if (await dbContext.Users.AnyAsync(
                user => user.Email == email,
                cancellationToken))
        {
            return null;
        }

        var user = new Users
        {
            UserName = request.FullName.Trim(),
            Department = request.Department?.Trim(),
            Email = email,
            UserRole = UserRole.User.ToString()
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
        dbContext.Users.Add(user);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: "IX_Users_Email"
            })
        {
            return null;
        }

        return CreateResponse(user);
    }

    public async Task<AuthResponse?> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        var user = await dbContext.Users.SingleOrDefaultAsync(
            candidate => candidate.Email == email,
            cancellationToken);

        if (user is null
            || passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password) == PasswordVerificationResult.Failed)
        {
            return null;
        }

        return CreateResponse(user);
    }

    private AuthResponse CreateResponse(Users user)
    {
        var role = Enum.TryParse<UserRole>(user.UserRole, true, out var parsedRole)
            && Enum.IsDefined(parsedRole)
            ? parsedRole
            : UserRole.User;
        var now = DateTime.UtcNow;
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Role, role.ToString())
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            notBefore: now,
            expires: now.AddHours(1),
            signingCredentials: credentials);

        return new AuthResponse
        {
            UserId = user.Id,
            FullName = user.UserName,
            Email = user.Email,
            Role = role,
            Token = new JwtSecurityTokenHandler().WriteToken(token)
        };
    }

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();
}
