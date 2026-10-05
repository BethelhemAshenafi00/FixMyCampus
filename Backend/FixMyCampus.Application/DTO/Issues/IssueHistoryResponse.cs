using FixMyCampus.Domain.Enums;

namespace FixMyCampus.Application.DTOs.Issues;

public class IssueHistoryResponse
{
    public int Id { get; set; }

    public IssueStatus? OldStatus { get; set; }

    public IssueStatus NewStatus { get; set; }

    public int ChangedByUserId { get; set; }

    public string ChangedByUserName { get; set; } = string.Empty;

    public DateTime ChangedAt { get; set; }

    public string? Comment { get; set; }
}