using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Core.Common.Extensions;
using Core.Common.Result;
using Core.Model.DTOs;
using Core.Model.Entities;
using SqlSugar;

namespace BlueIsland.Api.Controllers;

[ApiController]
[Route("api")]
public class AuthController : ControllerBase
{
    private readonly ISqlSugarClient _db;
    private readonly string _jwtSecretKey = "BlueIsland.SecretKey.2024.Guestbook";

    public AuthController(ISqlSugarClient db)
    {
        _db = db;
    }

    /// <summary>
    /// 登录
    /// </summary>
    [HttpPost("login")]
    public async Task<Result<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await _db.Queryable<SysUser>()
                .Where(it => it.Username == request.Username && !it.IsDeleted)
                .FirstAsync();

            if (user == null)
            {
                return Result<LoginResponse>.Fail("用户名或密码错误");
            }

            // 简单的密码验证（实际生产应使用BCrypt）
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            {
                return Result<LoginResponse>.Fail("用户名或密码错误");
            }

            var role = user.Role ?? "admin";
            var token = JwtHelper.CreateToken(user.Id, user.Username, role, _jwtSecretKey);

            return Result<LoginResponse>.Ok(new LoginResponse
            {
                Token = token,
                User = new SysUserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Role = role
                }
            });
        }
        catch (Exception ex)
        {
            return Result<LoginResponse>.Fail(ex.Message);
        }
    }

    /// <summary>
    /// 获取当前用户信息
    /// </summary>
    [HttpGet("user/info")]
    [Authorize]
    public async Task<Result<SysUserDto>> GetCurrentUser()
    {
        var userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var user = await _db.Queryable<SysUser>()
            .Where(it => it.Id == userId && !it.IsDeleted)
            .FirstAsync();

        if (user == null)
        {
            return Result<SysUserDto>.Fail("用户不存在");
        }

        return Result<SysUserDto>.Ok(new SysUserDto
        {
            Id = user.Id,
            Username = user.Username,
            Role = user.Role ?? "admin"
        });
    }

    /// <summary>
    /// 修改密码
    /// </summary>
    [HttpPost("password/update")]
    [Authorize]
    public async Task<Result> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _db.Queryable<SysUser>()
                .Where(it => it.Id == userId && !it.IsDeleted)
                .FirstAsync();

            if (user == null)
            {
                return Result.Fail("用户不存在");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.Password))
            {
                return Result.Fail("原密码错误");
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdateTime = DateTime.Now;
            await _db.Updateable(user).ExecuteCommandAsync();

            return Result.Ok();
        }
        catch (Exception ex)
        {
            return Result.Fail(ex.Message);
        }
    }

    /// <summary>
    /// 初始化管理员账户（首次使用时调用）
    /// </summary>
    [HttpPost("init-admin")]
    public async Task<Result<LoginResponse>> InitAdmin([FromBody] LoginRequest request)
    {
        try
        {
            var existingAdmin = await _db.Queryable<SysUser>()
                .Where(it => it.Role == "admin" && !it.IsDeleted)
                .FirstAsync();

            if (existingAdmin != null)
            {
                return Result<LoginResponse>.Fail("管理员已存在，请直接登录");
            }

            var admin = new SysUser
            {
                Username = request.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = "admin",
                CreateTime = DateTime.Now,
                UpdateTime = DateTime.Now,
                IsDeleted = false
            };

            await _db.Insertable(admin).ExecuteCommandAsync();

            var token = JwtHelper.CreateToken(admin.Id, admin.Username, admin.Role, _jwtSecretKey);

            return Result<LoginResponse>.Ok(new LoginResponse
            {
                Token = token,
                User = new SysUserDto
                {
                    Id = admin.Id,
                    Username = admin.Username,
                    Role = admin.Role
                }
            });
        }
        catch (Exception ex)
        {
            return Result<LoginResponse>.Fail(ex.Message);
        }
    }
}
