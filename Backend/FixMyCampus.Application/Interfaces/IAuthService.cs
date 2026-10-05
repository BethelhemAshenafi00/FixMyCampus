using FixMyCampus.Application.DTOs.Issues;

namespace FixMyCampus.Application.Interfaces;

public interface IIssueService
{
    Task<IssueResponse> CreateAsync(
        CreateIssueRequest request,
        int reporterId);

    Task<IssueResponse?> GetByIdAsync(int id);

    Task<IEnumerable<IssueResponse>> GetAllAsync(
        string? building = null,
        string? status = null);

    Task<IEnumerable<IssueResponse>> GetMyIssuesAsync(
        int reporterId);

    Task AssignAsync(
        int issueId,
        int technicianId,
        int adminId);

    Task UpdateStatusAsync(
        int issueId,
        UpdateIssueStatusRequest request,
        int adminId);
}