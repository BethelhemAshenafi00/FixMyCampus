using System.Security.Cryptography;
using FixMyCampus.Domain.Entities;
using FixMyCampus.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FixMyCampus.Infrastructure.Data;

public static class DataSeeder
{
    /// <summary>
    /// Applies any pending migrations and seeds initial demo users and sample issues if the database is empty.
    /// </summary>
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        // 1. Seed or update demo accounts so quick demo login always works
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == "admin@fix.com");
        if (adminUser == null)
        {
            adminUser = new Users
            {
                UserName = "Admin Facility Manager",
                Email = "admin@fix.com",
                PasswordHash = HashPassword("admin123"),
                UserRole = UserRole.Admin.ToString()
            };
            await context.Users.AddAsync(adminUser);
        }
        else
        {
            adminUser.PasswordHash = HashPassword("admin123");
            adminUser.UserRole = UserRole.Admin.ToString();
        }

        var technicianUser = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == "technician@fix.com");
        if (technicianUser == null)
        {
            technicianUser = new Users
            {
                UserName = "Alex Rivera (Tech)",
                Email = "technician@fix.com",
                PasswordHash = HashPassword("technician123"),
                UserRole = UserRole.Technician.ToString()
            };
            await context.Users.AddAsync(technicianUser);
        }
        else
        {
            technicianUser.PasswordHash = HashPassword("technician123");
            technicianUser.UserRole = UserRole.Technician.ToString();
        }

        var studentUser = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == "student@fix.com");
        if (studentUser == null)
        {
            studentUser = new Users
            {
                UserName = "Sarah Connor (Student)",
                Email = "student@fix.com",
                PasswordHash = HashPassword("student123"),
                UserRole = UserRole.User.ToString()
            };
            await context.Users.AddAsync(studentUser);
        }
        else
        {
            studentUser.PasswordHash = HashPassword("student123");
            studentUser.UserRole = UserRole.User.ToString();
        }

        await context.SaveChangesAsync();

            // 2. Seed Sample Issues if not present
            if (!await context.Issues.AnyAsync())
            {
                var issue1 = new Issue
                {
                    Title = "Projector not displaying HDMI input",
                    Description = "Projector in Block A Room 102 displays 'No Signal' when laptop is plugged in via HDMI.",
                    Category = IssueCategory.Projector,
                    Status = IssueStatus.Assigned,
                    Building = "Block A",
                    Room = "102",
                    ReporterId = studentUser.Id,
                    Reporter = UserRole.User,
                    AssignedStaffId = technicianUser.Id,
                    Urgency = IssuePriority.High,
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                };

                var issue2 = new Issue
                {
                    Title = "Campus Wi-Fi connectivity drops",
                    Description = "Wi-Fi access point in the Central Library 2nd floor disconnects every few minutes.",
                    Category = IssueCategory.Network,
                    Status = IssueStatus.InProgress,
                    Building = "Library",
                    Room = "2nd Floor Study Hall",
                    ReporterId = studentUser.Id,
                    Reporter = UserRole.User,
                    AssignedStaffId = technicianUser.Id,
                    Urgency = IssuePriority.Medium,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    UpdatedAt = DateTime.UtcNow.AddHours(-4)
                };

                var issue3 = new Issue
                {
                    Title = "Water pipe leakage in restroom",
                    Description = "Sink faucet pipe leaking continuously, water accumulating on the floor.",
                    Category = IssueCategory.Plumbing,
                    Status = IssueStatus.New,
                    Building = "Science Complex",
                    Room = "Restroom 1B",
                    ReporterId = studentUser.Id,
                    Reporter = UserRole.User,
                    AssignedStaffId = null,
                    Urgency = IssuePriority.High,
                    CreatedAt = DateTime.UtcNow.AddHours(-6),
                    UpdatedAt = null
                };

                var issue4 = new Issue
                {
                    Title = "Flickering lights in Computer Lab",
                    Description = "Overhead fluorescent fixtures in Computer Lab 3 are buzzing and flickering.",
                    Category = IssueCategory.Electrical,
                    Status = IssueStatus.Resolved,
                    Building = "Engineering Hall",
                    Room = "Lab 3",
                    ReporterId = studentUser.Id,
                    Reporter = UserRole.User,
                    AssignedStaffId = technicianUser.Id,
                    Urgency = IssuePriority.Low,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1),
                    ResolvedAt = DateTime.UtcNow.AddDays(-1)
                };

                await context.Issues.AddRangeAsync(issue1, issue2, issue3, issue4);
                await context.SaveChangesAsync();

                // 3. Seed History Logs
                var histories = new List<IssueHistory>
                {
                    new IssueHistory
                    {
                        IssueId = issue1.Id,
                        UserId = studentUser.Id,
                        Action = "Created",
                        Description = "Issue reported in Block A, Room 102",
                        CreatedAt = issue1.CreatedAt
                    },
                    new IssueHistory
                    {
                        IssueId = issue1.Id,
                        UserId = adminUser.Id,
                        Action = "Assigned",
                        Description = $"Assigned to technician {technicianUser.UserName}",
                        CreatedAt = issue1.UpdatedAt ?? DateTime.UtcNow
                    },
                    new IssueHistory
                    {
                        IssueId = issue2.Id,
                        UserId = studentUser.Id,
                        Action = "Created",
                        Description = "Issue reported in Library, 2nd Floor Study Hall",
                        CreatedAt = issue2.CreatedAt
                    },
                    new IssueHistory
                    {
                        IssueId = issue2.Id,
                        UserId = technicianUser.Id,
                        Action = "Status Changed",
                        Description = "Status changed to InProgress. Investigating router switch.",
                        CreatedAt = issue2.UpdatedAt ?? DateTime.UtcNow
                    },
                    new IssueHistory
                    {
                        IssueId = issue3.Id,
                        UserId = studentUser.Id,
                        Action = "Created",
                        Description = "Issue reported in Science Complex, Restroom 1B",
                        CreatedAt = issue3.CreatedAt
                    },
                    new IssueHistory
                    {
                        IssueId = issue4.Id,
                        UserId = studentUser.Id,
                        Action = "Created",
                        Description = "Issue reported in Engineering Hall, Lab 3",
                        CreatedAt = issue4.CreatedAt
                    },
                    new IssueHistory
                    {
                        IssueId = issue4.Id,
                        UserId = technicianUser.Id,
                        Action = "Status Changed",
                        Description = "Status changed to Resolved. Replaced ballast and bulbs.",
                        CreatedAt = issue4.ResolvedAt ?? DateTime.UtcNow
                    }
                };

                await context.IssueStatusHistories.AddRangeAsync(histories);
                await context.SaveChangesAsync();
            }
    }

    /// <summary>
    /// Hashes a password using PBKDF2 with SHA256 (10,000 iterations), matching AuthService format.
    /// </summary>
    private static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            10000,
            HashAlgorithmName.SHA256,
            20);

        byte[] hashWithSalt = new byte[36];
        Array.Copy(salt, 0, hashWithSalt, 0, 16);
        Array.Copy(hash, 0, hashWithSalt, 16, 20);
        return Convert.ToBase64String(hashWithSalt);
    }
}
