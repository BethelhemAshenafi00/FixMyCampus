using FixMyCampus.Application.DTOs.Dashboard;
using FixMyCampus.Application.Interfaces;
using FixMyCampus.Domain.Enums;
using FixMyCampus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FixMyCampus.Application.Services;

/// <summary>Service for retrieving dashboard statistics and metrics for admin users.</summary>
public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>Retrieves comprehensive dashboard statistics including issue counts by status and priority.</summary>
    public async Task<DashboardResponse> GetDashboardAsync()
    {
        var issues = await _context.Issues.ToListAsync();

        var dashboard = new DashboardResponse
        {
            TotalIssues = issues.Count,
            NewIssues = issues.Count(i => i.Status == IssueStatus.New),
            AssignedIssues = issues.Count(i => i.Status == IssueStatus.Assigned),
            InProgressIssues = issues.Count(i => i.Status == IssueStatus.InProgress),
            ResolvedIssues = issues.Count(i => i.Status == IssueStatus.Resolved),
            HighPriorityIssues = issues.Count(i => i.Urgency == IssuePriority.High)
        };

        return dashboard;
    }
}
