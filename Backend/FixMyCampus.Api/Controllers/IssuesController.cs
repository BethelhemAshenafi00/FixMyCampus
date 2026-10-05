using System.Security.Claims;
using FixMyCampus.Application.DTOs.Issues;
using FixMyCampus.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FixMyCampus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class IssuesController(IIssueService issueService) : ControllerBase
{
    /// <summary>
    /// Creates a new campus issue report.
    /// </summary>
    [HttpPost]
    [ProducesResponseType<IssueResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IssueResponse>> Create(
        [FromBody] CreateIssueRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "User identifier claim not found in token."
            });
        }

        var createdIssue = await issueService.CreateAsync(request, currentUserId.Value);
        return CreatedAtAction(
            nameof(GetById),
            new { id = createdIssue.Id },
            createdIssue);
    }

 
    [HttpGet]
    [Authorize(Roles = "Admin,Technician")]
    [ProducesResponseType<IEnumerable<IssueResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<IssueResponse>>> GetAll(
        [FromQuery] string? building = null,
        [FromQuery] string? status = null)
    {
        var issues = await issueService.GetAllAsync(building, status);
        return Ok(issues);
    }

  
    [HttpGet("my")]
    [ProducesResponseType<IEnumerable<IssueResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<IssueResponse>>> GetMyIssues()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "User identifier claim not found in token."
            });
        }

        var myIssues = await issueService.GetMyIssuesAsync(currentUserId.Value);
        return Ok(myIssues);
    }


    [HttpGet("{id:int}")]
    [ProducesResponseType<IssueResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IssueResponse>> GetById([FromRoute] int id)
    {
        var issue = await issueService.GetByIdAsync(id);
        if (issue is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = $"Issue with ID {id} was not found."
            });
        }

        return Ok(issue);
    }


    [HttpPut("{id:int}/assign")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Assign(
        [FromRoute] int id,
        [FromBody] AssignIssueRequest request)
    {
        var adminId = GetCurrentUserId();
        if (adminId is null)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "User identifier claim not found in token."
            });
        }

        try
        {
            await issueService.AssignAsync(id, request.TechnicianId, adminId.Value);
            return Ok(new { message = "Issue successfully assigned to technician." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = ex.Message
            });
        }
    }

  
    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin,Technician")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        [FromRoute] int id,
        [FromBody] UpdateIssueStatusRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "User identifier claim not found in token."
            });
        }

        try
        {
            await issueService.UpdateStatusAsync(id, request, currentUserId.Value);
            return Ok(new { message = "Issue status successfully updated." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = ex.Message
            });
        }
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub")
            ?? User.FindFirst("userId");

        return int.TryParse(claim?.Value, out var userId) ? userId : null;
    }
}
