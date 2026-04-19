using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Core.Common.Result;
using Core.Model.DTOs;
using Core.Model.Entities;
using SqlSugar;

namespace BlueIsland.Api.Controllers;

[ApiController]
[Route("api/email-config")]
[Authorize(Roles = "admin")]
public class EmailConfigController : ControllerBase
{
    private readonly ISqlSugarClient _db;

    public EmailConfigController(ISqlSugarClient db)
    {
        _db = db;
    }

    /// <summary>
    /// 获取邮箱配置
    /// </summary>
    [HttpGet]
    public async Task<Result<EmailConfigDto>> GetConfig()
    {
        var config = await _db.Queryable<EmailConfig>()
            .Where(it => it.Id == 1)
            .FirstAsync();

        if (config == null)
        {
            config = new EmailConfig { Id = 1 };
            await _db.Insertable(config).ExecuteCommandAsync();
        }

        return Result<EmailConfigDto>.Ok(new EmailConfigDto
        {
            Id = config.Id,
            SmtpHost = config.SmtpHost,
            SmtpPort = config.SmtpPort,
            EnableSsl = config.EnableSsl,
            FromEmail = config.FromEmail,
            FromName = config.FromName,
            SmtpUsername = config.SmtpUsername,
            SmtpPassword = config.SmtpPassword,
            Enabled = config.Enabled,
            Remark = config.Remark
        });
    }

    /// <summary>
    /// 保存邮箱配置
    /// </summary>
    [HttpPost]
    public async Task<Result<EmailConfigDto>> SaveConfig([FromBody] EmailConfigDto dto)
    {
        var config = await _db.Queryable<EmailConfig>()
            .Where(it => it.Id == 1)
            .FirstAsync();

        if (config == null)
        {
            config = new EmailConfig { Id = 1 };
        }

        config.SmtpHost = dto.SmtpHost;
        config.SmtpPort = dto.SmtpPort;
        config.EnableSsl = dto.EnableSsl;
        config.FromEmail = dto.FromEmail;
        config.FromName = dto.FromName;
        config.SmtpUsername = dto.SmtpUsername;
        config.SmtpPassword = dto.SmtpPassword;
        config.Enabled = dto.Enabled;
        config.Remark = dto.Remark;

        var exists = await _db.Queryable<EmailConfig>().Where(it => it.Id == 1).AnyAsync();

        if (exists)
        {
            await _db.Updateable(config)
                .UpdateColumns(it => new { it.SmtpHost, it.SmtpPort, it.EnableSsl, it.FromEmail, it.FromName, it.SmtpUsername, it.SmtpPassword, it.Enabled, it.Remark })
                .Where(it => it.Id == 1)
                .ExecuteCommandAsync();
        }
        else
        {
            await _db.Insertable(config).ExecuteCommandAsync();
        }

        return Result<EmailConfigDto>.Ok(new EmailConfigDto
        {
            Id = config.Id,
            SmtpHost = config.SmtpHost,
            SmtpPort = config.SmtpPort,
            EnableSsl = config.EnableSsl,
            FromEmail = config.FromEmail,
            FromName = config.FromName,
            SmtpUsername = config.SmtpUsername,
            SmtpPassword = config.SmtpPassword,
            Enabled = config.Enabled,
            Remark = config.Remark
        });
    }

    /// <summary>
    /// 测试发送邮箱配置
    /// </summary>
    [HttpPost("test")]
    public async Task<Result> TestConfig([FromBody] EmailConfigDto dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.SmtpHost) || string.IsNullOrEmpty(dto.FromEmail) || string.IsNullOrEmpty(dto.SmtpUsername) || string.IsNullOrEmpty(dto.SmtpPassword))
            {
                return Result.Fail("请填写完整的邮箱配置");
            }

            // 简单验证配置是否可用
            return Result.Ok("邮箱配置测试成功（实际发送功能待实现）");
        }
        catch (Exception ex)
        {
            return Result.Fail($"测试失败: {ex.Message}");
        }
    }
}
