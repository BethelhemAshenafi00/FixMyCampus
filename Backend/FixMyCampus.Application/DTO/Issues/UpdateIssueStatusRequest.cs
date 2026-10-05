using FixMyCampus.Domain.Enums;

namespace FixMyCampus.Application.DTOs.Issues;

public class UpdateIssueStatusRequest
{
    public IssueStatus NewStatus { get; set; }

    public string? Comment { get; set; }
}