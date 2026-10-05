using FixMyCampus.Application.DTOs.Dashboard;

namespace FixMyCampus.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardResponse> GetDashboardAsync();
}