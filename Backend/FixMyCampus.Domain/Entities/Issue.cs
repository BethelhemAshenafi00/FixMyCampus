using FixMyCampus.Domain.Enums;

namespace FixMyCampus.Domain.Entities;

public class Issue
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Category { get; set; }

    public IssueStatus Status { get; set; } = IssueStatus.New;

    public string Location { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    // Reporter
    public int ReporterId { get; set; }

    public UserRoles Reporter { get; set; } 

    // Assigned staff
    public int? AssignedStaffId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    // Status history
    public ICollection<IssueStatusHistory> StatusHistory { get; set; }
        = new List<IssueStatusHistory>();
}