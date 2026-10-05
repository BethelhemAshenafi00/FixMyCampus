using FixMyCampus.Domain;

namespace FixMyCampus.Domain.Entities;

public class Issue
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Category { get; set; }

    public IssueStatus Status { get; set; } = IssueStatus.New;

    public string Building { get; set; } = string.Empty;

    public string Room { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    // Reporter
    public int ReporterId { get; set; }

    public UserRoles Reporter { get; set; } 

    // Assigned staff
    public int? AssignedStaffId { get; set; }

  public IssuePriority Urgency { get; set; } = IssuePriority.Medium;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }
}