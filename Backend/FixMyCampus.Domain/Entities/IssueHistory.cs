namespace FixMyCampus.Domain.Entities;

public class IssueHistory
{
    public int Id { get; set; }

    public int IssueId { get; set; }

    public int UserId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }
}