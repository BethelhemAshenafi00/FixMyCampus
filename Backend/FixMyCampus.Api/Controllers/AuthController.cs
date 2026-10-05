using FixMyCampus.Api.Services;
using FixMyCampus.Application.DTO.Auth;
using FixMyCampus.Application.DTOs.Auth;
using FixMyCampus.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FixMyCampus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    
    [HttpPost("register")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.RegisterAsync(request, cancellationToken);
        return response is null
            ? Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "An account with this email already exists."
            })
            : Ok(response);
    }

  
    [HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.LoginAsync(request, cancellationToken);
        return response is null
            ? Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "The email or password is incorrect."
            })
            : Ok(response);
    }
}
