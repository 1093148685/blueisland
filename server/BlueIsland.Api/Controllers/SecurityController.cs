using Microsoft.AspNetCore.Mvc;
using SqlSugar;
using Core.Model.Entities;

namespace BlueIsland.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SecurityController : ControllerBase
{
    private readonly ISqlSugarClient _db;

    public SecurityController(ISqlSugarClient db)
    {
        _db = db;
    }

    /// <summary>
    /// 获取安全统计数据
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalLogs = await _db.Queryable<SecurityLog>().CountAsync();
        var today = DateTime.Now.Date;
        var todayLogs = await _db.Queryable<SecurityLog>()
            .Where(x => x.CreateTime >= today)
            .CountAsync();

        var eventTypes = await _db.Queryable<SecurityLog>()
            .GroupBy(x => x.EventType)
            .Select(x => new { Type = x.EventType, Count = SqlFunc.AggregateCount(x.Id) })
            .ToListAsync();

        var topIps = await _db.Queryable<SecurityLog>()
            .GroupBy(x => x.IpAddress)
            .Select(x => new { Ip = x.IpAddress, Count = SqlFunc.AggregateCount(x.Id) })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync();

        return Ok(new
        {
            totalLogs,
            todayLogs,
            eventTypes = eventTypes.ToDictionary(x => x.Type ?? "UNKNOWN", x => x.Count),
            topIps = topIps.ToDictionary(x => x.Ip ?? "unknown", x => x.Count)
        });
    }

    /// <summary>
    /// 获取安全日志
    /// </summary>
    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(int page = 1, int pageSize = 50)
    {
        var skip = (page - 1) * pageSize;
        var logs = await _db.Queryable<SecurityLog>()
            .OrderByDescending(x => x.CreateTime)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync();

        var total = await _db.Queryable<SecurityLog>().CountAsync();

        return Ok(new
        {
            list = logs.Select(x => new
            {
                x.Id,
                x.EventType,
                x.IpAddress,
                x.Path,
                x.Details,
                x.CreateTime
            }),
            total,
            page,
            pageSize
        });
    }

    /// <summary>
    /// 获取安全设置
    /// </summary>
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _db.Queryable<SecuritySettings>().FirstAsync();
        if (settings == null)
        {
            settings = new SecuritySettings { Id = 1 };
            await _db.Insertable(settings).ExecuteCommandAsync();
        }

        return Ok(new
        {
            settings.MaxRequestsPerMinute,
            settings.ViolationThreshold,
            settings.BanDurationMinutes,
            settings.EnableSignatureCheck,
            settings.EnableRefererCheck,
            settings.AllowedRefererDomains,
            settings.EnableIpBlockList,
            settings.UpdateTime
        });
    }

    /// <summary>
    /// 更新安全设置
    /// </summary>
    [HttpPost("settings")]
    public async Task<IActionResult> SaveSettings([FromBody] SecuritySettings settings)
    {
        settings.Id = 1;
        settings.UpdateTime = DateTime.Now;

        var existing = await _db.Queryable<SecuritySettings>().FirstAsync();
        if (existing != null)
        {
            await _db.Updateable(settings).ExecuteCommandAsync();
        }
        else
        {
            await _db.Insertable(settings).ExecuteCommandAsync();
        }

        return Ok(new { message = "设置已保存" });
    }

    /// <summary>
    /// 获取临时封禁的 IP 列表
    /// </summary>
    [HttpGet("blocked-ips")]
    public IActionResult GetBlockedIps([FromServices] IGlobalBlockedIpService blockedIpService)
    {
        var blocked = blockedIpService.GetBlockedIps();
        return Ok(blocked);
    }

    /// <summary>
    /// 手动解封 IP
    /// </summary>
    [HttpDelete("blocked-ips/{ip}")]
    public IActionResult UnblockIp(string ip, [FromServices] IGlobalBlockedIpService blockedIpService)
    {
        blockedIpService.RemoveIp(ip);
        return Ok(new { message = $"IP {ip} 已解封" });
    }

    /// <summary>
    /// 手动封禁 IP
    /// </summary>
    [HttpPost("blocked-ips")]
    public IActionResult BlockIp([FromBody] BlockIpRequest request, [FromServices] IGlobalBlockedIpService blockedIpService)
    {
        blockedIpService.AddIp(request.IpAddress, request.Reason ?? "手动封禁");
        return Ok(new { message = $"IP {request.IpAddress} 已封禁" });
    }
}

public class BlockIpRequest
{
    public string IpAddress { get; set; } = "";
    public string? Reason { get; set; }
}
