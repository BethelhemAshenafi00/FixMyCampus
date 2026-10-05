using FixMyCampus.Domain.Enums;

namespace FixMyCampus.Application.DTOs.Issues;

public class CreateIssueRequest
{
    public string Category { get; set; } = string.Empty;

    public string Building { get; set; } = string.Empty;

    public string Room { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public IssuePriority Urgency { get; set; } = IssuePriority.Medium;
}