using FixMyCampus.Application.DTOs.Issues;
using FixMyCampus.Application.Interfaces;
using FixMyCampus.Domain.Entities;
using FixMyCampus.Domain.Enums;
using FixMyCampus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FixMyCampus.Api.Services;

public sealed class IssueService(AppDbContext dbContext) : IIssueService
{
    public async Task<IssueResponse> CreateAsync(
        CreateIssueRequest request,
        int reporterId)
    {
        var reporter = await dbContext.Users.FindAsync(reporterId);
        var reporterRole = reporter != null && Enum.TryParse<UserRole>(reporter.UserRole, true, out var role)
            ? role
            : UserRole.User;

        var category = Enum.TryParse<IssueCategory>(request.Category, true, out var parsedCategory)
            ? parsedCategory
            : IssueCategory.Other;

        var issue = new Issue
        {
            Title = $"{category} - {request.Building} {request.Room}".Trim(),
            Description = request.Description.Trim(),
            Category = category,
            Status = IssueStatus.New,
            Building = request.Building.Trim(),
            Room = request.Room.Trim(),
            ReporterId = reporterId,
            Reporter = reporterRole,
            Urgency = request.Urgency,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Issues.Add(issue);
        await dbContext.SaveChangesAsync();

        dbContext.IssueStatusHistories.Add(new IssueHistory
        {
            IssueId = issue.Id,
            UserId = reporterId,
            Action = "Created",
            Description = "Issue reported",
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        return new IssueResponse
        {
            Id = issue.Id,
            Category = issue.Category,
            Building = issue.Building,
            Room = issue.Room,
            Description = issue.Description,
            Status = issue.Status,
            Priority = issue.Urgency,
            ReporterId = issue.ReporterId,
            ReporterName = reporter?.UserName ?? string.Empty,
            TechnicianId = null,
            TechnicianName = null,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt,
            ResolvedAt = issue.ResolvedAt
        };
    }

    public async Task<IssueResponse?> GetByIdAsync(int id)
    {
        var issue = await dbContext.Issues.FirstOrDefaultAsync(i => i.Id == id);
        if (issue is null)
        {
            return null;
        }

        var reporterName = await dbContext.Users
            .Where(u => u.Id == issue.ReporterId)
            .Select(u => u.UserName)
            .FirstOrDefaultAsync() ?? string.Empty;

        var technicianName = issue.AssignedStaffId.HasValue
            ? await dbContext.Users
                .Where(u => u.Id == issue.AssignedStaffId.Value)
                .Select(u => u.UserName)
                .FirstOrDefaultAsync()
            : null;

        return new IssueResponse
        {
            Id = issue.Id,
            Category = issue.Category,
            Building = issue.Building,
            Room = issue.Room,
            Description = issue.Description,
            Status = issue.Status,
            Priority = issue.Urgency,
            ReporterId = issue.ReporterId,
            ReporterName = reporterName,
            TechnicianId = issue.AssignedStaffId,
            TechnicianName = technicianName,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt,
            ResolvedAt = issue.ResolvedAt
        };
    }

    public async Task<IEnumerable<IssueResponse>> GetAllAsync(
        string? building = null,
        string? status = null)
    {
        var query = dbContext.Issues.AsQueryable();

        if (!string.IsNullOrWhiteSpace(building))
        {
            var normalizedBuilding = building.Trim().ToLower();
            query = query.Where(i => i.Building.ToLower() == normalizedBuilding);
        }

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<IssueStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(i => i.Status == parsedStatus);
        }

        var issues = await query
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        var userIds = issues
            .Select(i => i.ReporterId)
            .Concat(issues.Where(i => i.AssignedStaffId.HasValue).Select(i => i.AssignedStaffId!.Value))
            .Distinct()
            .ToList();

        var usersMap = await dbContext.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName);

        return issues.Select(issue => new IssueResponse
        {
            Id = issue.Id,
            Category = issue.Category,
            Building = issue.Building,
            Room = issue.Room,
            Description = issue.Description,
            Status = issue.Status,
            Priority = issue.Urgency,
            ReporterId = issue.ReporterId,
            ReporterName = usersMap.GetValueOrDefault(issue.ReporterId, string.Empty),
            TechnicianId = issue.AssignedStaffId,
            TechnicianName = issue.AssignedStaffId.HasValue
                ? usersMap.GetValueOrDefault(issue.AssignedStaffId.Value)
                : null,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt,
            ResolvedAt = issue.ResolvedAt
        });
    }

    public async Task<IEnumerable<IssueResponse>> GetMyIssuesAsync(int reporterId)
    {
        var issues = await dbContext.Issues
            .Where(i => i.ReporterId == reporterId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        var reporter = await dbContext.Users.FindAsync(reporterId);

        var technicianIds = issues
            .Where(i => i.AssignedStaffId.HasValue)
            .Select(i => i.AssignedStaffId!.Value)
            .Distinct()
            .ToList();

        var technicianMap = await dbContext.Users
            .Where(u => technicianIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName);

        return issues.Select(issue => new IssueResponse
        {
            Id = issue.Id,
            Category = issue.Category,
            Building = issue.Building,
            Room = issue.Room,
            Description = issue.Description,
            Status = issue.Status,
            Priority = issue.Urgency,
            ReporterId = issue.ReporterId,
            ReporterName = reporter?.UserName ?? string.Empty,
            TechnicianId = issue.AssignedStaffId,
            TechnicianName = issue.AssignedStaffId.HasValue
                ? technicianMap.GetValueOrDefault(issue.AssignedStaffId.Value)
                : null,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt,
            ResolvedAt = issue.ResolvedAt
        });
    }

    public async Task AssignAsync(
        int issueId,
        int technicianId,
        int adminId)
    {
        var issue = await dbContext.Issues.FindAsync(issueId)
            ?? throw new KeyNotFoundException($"Issue with ID {issueId} was not found.");

        var technician = await dbContext.Users.FindAsync(technicianId)
            ?? throw new KeyNotFoundException($"Technician with ID {technicianId} was not found.");

        issue.AssignedStaffId = technicianId;
        issue.Status = IssueStatus.Assigned;
        issue.UpdatedAt = DateTime.UtcNow;

        dbContext.IssueStatusHistories.Add(new IssueHistory
        {
            IssueId = issue.Id,
            UserId = adminId,
            Action = "Assigned",
            Description = $"Assigned to technician {technician.UserName} (ID: {technicianId})",
            CreatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();
    }

    public async Task UpdateStatusAsync(
        int issueId,
        UpdateIssueStatusRequest request,
        int adminId)
    {
        var issue = await dbContext.Issues.FindAsync(issueId)
            ?? throw new KeyNotFoundException($"Issue with ID {issueId} was not found.");

        var oldStatus = issue.Status;
        issue.Status = request.NewStatus;
        issue.UpdatedAt = DateTime.UtcNow;

        if (request.NewStatus == IssueStatus.Resolved)
        {
            issue.ResolvedAt = DateTime.UtcNow;
        }
        else if (oldStatus == IssueStatus.Resolved)
        {
            issue.ResolvedAt = null;
        }

        dbContext.IssueStatusHistories.Add(new IssueHistory
        {
            IssueId = issue.Id,
            UserId = adminId,
            Action = $"Status changed from {oldStatus} to {request.NewStatus}",
            Description = request.Comment,
            CreatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();
    }
}
