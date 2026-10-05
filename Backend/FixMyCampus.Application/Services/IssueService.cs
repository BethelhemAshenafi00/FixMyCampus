using FixMyCampus.Application.DTOs.Issues;
using FixMyCampus.Application.Interfaces;
using FixMyCampus.Domain.Entities;
using FixMyCampus.Domain.Enums;
using FixMyCampus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FixMyCampus.Application.Services;

/// <summary>Service for managing issue lifecycle: creation, retrieval, assignment, and status updates.</summary>
public class IssueService : IIssueService
{
    private readonly AppDbContext _context;

    public IssueService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>Creates a new issue reported by the given user.</summary>
    public async Task<IssueResponse> CreateAsync(
        CreateIssueRequest request,
        int reporterId)
    {
        // Parse category from string
        if (!Enum.TryParse<IssueCategory>(request.Category, ignoreCase: true, out var category))
        {
            category = IssueCategory.Other;
        }

        var issue = new Issue
        {
            Title = request.Category,
            Description = request.Description,
            Category = category,
            Building = request.Building,
            Room = request.Room,
            ReporterId = reporterId,
            Status = IssueStatus.New,
            Urgency = request.Urgency,
            CreatedAt = DateTime.UtcNow
        };

        _context.Issues.Add(issue);
        await _context.SaveChangesAsync();

        // Create initial history record
        var history = new IssueHistory
        {
            IssueId = issue.Id,
            UserId = reporterId,
            Action = "Created",
            Description = $"Issue reported in {request.Building}, Room {request.Room}",
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<IssueHistory>().Add(history);
        await _context.SaveChangesAsync();

        // Fetch reporter name
        var reporter = await _context.Users.FirstOrDefaultAsync(u => u.Id == reporterId);

        return MapToResponse(issue, reporter?.UserName ?? "Unknown");
    }

    /// <summary>Retrieves an issue by ID with all related data.</summary>
    public async Task<IssueResponse?> GetByIdAsync(int id)
    {
        var issue = await _context.Issues
            .FirstOrDefaultAsync(i => i.Id == id);

        if (issue == null)
            return null;

        var reporter = await _context.Users.FirstOrDefaultAsync(u => u.Id == issue.ReporterId);
        var technician = issue.AssignedStaffId.HasValue
            ? await _context.Users.FirstOrDefaultAsync(u => u.Id == issue.AssignedStaffId.Value)
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
            ReporterName = reporter?.UserName ?? "Unknown",
            TechnicianId = issue.AssignedStaffId,
            TechnicianName = technician?.UserName,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt,
            ResolvedAt = issue.ResolvedAt
        };
    }

    /// <summary>Retrieves all issues with optional filtering by building and/or status.</summary>
    public async Task<IEnumerable<IssueResponse>> GetAllAsync(
        string? building = null,
        string? status = null)
    {
        var query = _context.Issues.AsQueryable();

        if (!string.IsNullOrWhiteSpace(building))
        {
            query = query.Where(i => i.Building.Contains(building));
        }

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<IssueStatus>(status, ignoreCase: true, out var issueStatus))
        {
            query = query.Where(i => i.Status == issueStatus);
        }

        var issues = await query.ToListAsync();
        var userIds = issues.Select(i => i.ReporterId)
            .Union(issues.Where(i => i.AssignedStaffId.HasValue).Select(i => i.AssignedStaffId!.Value))
            .Distinct();

        var users = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync();

        return issues.Select(issue =>
        {
            var reporter = users.FirstOrDefault(u => u.Id == issue.ReporterId);
            var technician = issue.AssignedStaffId.HasValue
                ? users.FirstOrDefault(u => u.Id == issue.AssignedStaffId.Value)
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
                ReporterName = reporter?.UserName ?? "Unknown",
                TechnicianId = issue.AssignedStaffId,
                TechnicianName = technician?.UserName,
                CreatedAt = issue.CreatedAt,
                UpdatedAt = issue.UpdatedAt,
                ResolvedAt = issue.ResolvedAt
            };
        });
    }

    /// <summary>Retrieves all issues reported by a specific user (reporter).</summary>
    public async Task<IEnumerable<IssueResponse>> GetMyIssuesAsync(int reporterId)
    {
        var issues = await _context.Issues
            .Where(i => i.ReporterId == reporterId)
            .ToListAsync();

        var reporter = await _context.Users.FirstOrDefaultAsync(u => u.Id == reporterId);
        var assignedStaffIds = issues
            .Where(i => i.AssignedStaffId.HasValue)
            .Select(i => i.AssignedStaffId!.Value)
            .Distinct();

        var technicians = await _context.Users
            .Where(u => assignedStaffIds.Contains(u.Id))
            .ToListAsync();

        return issues.Select(issue =>
        {
            var technician = issue.AssignedStaffId.HasValue
                ? technicians.FirstOrDefault(u => u.Id == issue.AssignedStaffId.Value)
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
                ReporterName = reporter?.UserName ?? "Unknown",
                TechnicianId = issue.AssignedStaffId,
                TechnicianName = technician?.UserName,
                CreatedAt = issue.CreatedAt,
                UpdatedAt = issue.UpdatedAt,
                ResolvedAt = issue.ResolvedAt
            };
        });
    }

    /// <summary>Assigns an issue to a technician and changes status from New to Assigned.</summary>
    public async Task AssignAsync(
        int issueId,
        int technicianId,
        int adminId)
    {
        var issue = await _context.Issues.FirstOrDefaultAsync(i => i.Id == issueId);
        if (issue == null)
            throw new InvalidOperationException($"Issue {issueId} not found");

        if (issue.Status != IssueStatus.New)
            throw new InvalidOperationException("Issue must be in 'New' status to assign");

        issue.AssignedStaffId = technicianId;
        issue.Status = IssueStatus.Assigned;
        issue.UpdatedAt = DateTime.UtcNow;

        _context.Issues.Update(issue);
        await _context.SaveChangesAsync();

        // Log history
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == adminId);
        var technician = await _context.Users.FirstOrDefaultAsync(u => u.Id == technicianId);

        var history = new IssueHistory
        {
            IssueId = issue.Id,
            UserId = adminId,
            Action = "Assigned",
            Description = $"Assigned to {technician?.UserName ?? "Unknown"} by {admin?.UserName ?? "Unknown"}",
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<IssueHistory>().Add(history);
        await _context.SaveChangesAsync();
    }

    /// <summary>Updates the issue status along the allowed path: New → Assigned → In Progress → Resolved.</summary>
    public async Task UpdateStatusAsync(
        int issueId,
        UpdateIssueStatusRequest request,
        int adminId)
    {
        var issue = await _context.Issues.FirstOrDefaultAsync(i => i.Id == issueId);
        if (issue == null)
            throw new InvalidOperationException($"Issue {issueId} not found");

        // Validate status transition
        ValidateStatusTransition(issue.Status, request.NewStatus);

        var oldStatus = issue.Status;
        issue.Status = request.NewStatus;
        issue.UpdatedAt = DateTime.UtcNow;

        if (request.NewStatus == IssueStatus.Resolved)
        {
            issue.ResolvedAt = DateTime.UtcNow;
        }

        _context.Issues.Update(issue);
        await _context.SaveChangesAsync();

        // Log history
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == adminId);

        var history = new IssueHistory
        {
            IssueId = issue.Id,
            UserId = adminId,
            Action = "Status Changed",
            Description = $"Status changed from {oldStatus} to {request.NewStatus}. {request.Comment}",
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<IssueHistory>().Add(history);
        await _context.SaveChangesAsync();
    }

    /// <summary>Validates that a status transition follows the allowed path: New → Assigned → In Progress → Resolved.</summary>
    private void ValidateStatusTransition(IssueStatus currentStatus, IssueStatus newStatus)
    {
        // Allow only forward transitions
        var allowedTransitions = new Dictionary<IssueStatus, IssueStatus[]>
        {
            { IssueStatus.New, new[] { IssueStatus.Assigned } },
            { IssueStatus.Assigned, new[] { IssueStatus.InProgress } },
            { IssueStatus.InProgress, new[] { IssueStatus.Resolved } },
            { IssueStatus.Resolved, Array.Empty<IssueStatus>() } // No transitions from Resolved
        };

        if (!allowedTransitions.TryGetValue(currentStatus, out var allowed) ||
            !allowed.Contains(newStatus))
        {
            throw new InvalidOperationException(
                $"Cannot transition from {currentStatus} to {newStatus}. " +
                $"Status must follow the path: New → Assigned → In Progress → Resolved");
        }
    }

    /// <summary>Maps an Issue entity to an IssueResponse DTO.</summary>
    private IssueResponse MapToResponse(Issue issue, string reporterName)
    {
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
            TechnicianName = null,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt,
            ResolvedAt = issue.ResolvedAt
        };
    }
}
