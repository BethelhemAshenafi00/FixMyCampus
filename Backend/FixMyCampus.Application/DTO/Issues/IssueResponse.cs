using FixMyCampus.Domain.Enums;

namespace FixMyCampus.Application.DTOs.Issues;

public class IssueResponse
{
    public int Id { get; set; }

    public IssueCategory Category { get; set; }

    public string Building { get; set; } = string.Empty;

    public string Room { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public IssueStatus Status { get; set; }

    public IssuePriority Priority { get; set; }

    public int ReporterId { get; set; }

    public string ReporterName { get; set; } = string.Empty;

    public int? TechnicianId { get; set; }

    public string? TechnicianName { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }
}