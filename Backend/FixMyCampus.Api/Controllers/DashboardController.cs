using FixMyCampus.Application.DTOs.Dashboard;
using FixMyCampus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FixMyCampus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    
    [HttpGet]
    [ProducesResponseType<DashboardResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<DashboardResponse>> GetDashboard()
    {
        var response = await dashboardService.GetDashboardAsync();
        return Ok(response);
    }
}
