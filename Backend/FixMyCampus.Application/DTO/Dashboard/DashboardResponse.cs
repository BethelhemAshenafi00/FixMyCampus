namespace FixMyCampus.Application.DTOs.Dashboard;

public class DashboardResponse
{
    public int TotalIssues { get; set; }

    public int NewIssues { get; set; }

    public int AssignedIssues { get; set; }

    public int InProgressIssues { get; set; }

    public int ResolvedIssues { get; set; }

    public int HighPriorityIssues { get; set; }
}