using FixMyCampus.Application.DTOs.Dashboard;
using FixMyCampus.Application.Interfaces;
using FixMyCampus.Domain.Enums;
using FixMyCampus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FixMyCampus.Api.Services;

public sealed class DashboardService(AppDbContext dbContext) : IDashboardService
{
    public async Task<DashboardResponse> GetDashboardAsync()
    {
        var totalIssues = await dbContext.Issues.CountAsync();
        var newIssues = await dbContext.Issues.CountAsync(i => i.Status == IssueStatus.New);
        var assignedIssues = await dbContext.Issues.CountAsync(i => i.Status == IssueStatus.Assigned);
        var inProgressIssues = await dbContext.Issues.CountAsync(i => i.Status == IssueStatus.InProgress);
        var resolvedIssues = await dbContext.Issues.CountAsync(i => i.Status == IssueStatus.Resolved);
        var highPriorityIssues = await dbContext.Issues.CountAsync(i => i.Urgency == IssuePriority.High);

        return new DashboardResponse
        {
            TotalIssues = totalIssues,
            NewIssues = newIssues,
            AssignedIssues = assignedIssues,
            InProgressIssues = inProgressIssues,
            ResolvedIssues = resolvedIssues,
            HighPriorityIssues = highPriorityIssues
        };
    }
}
