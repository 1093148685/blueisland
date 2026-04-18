using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Core.Common.Result;
using Core.Model.DTOs;
using Core.Model.Entities;
using SqlSugar;
using System.Collections.Concurrent;

namespace BlueIsland.Api.Controllers;

[ApiController]
[Route("api/access")]
public class AccessController : ControllerBase
{
    private readonly ISqlSugarClient _db;

    // 在线用户跟踪（内存中）- SessionId -> DateTime
    private static readonly ConcurrentDictionary<string, DateTime> _onlineUsers = new();
    // 页面在线统计 - 页面名称 -> SessionId列表
    private static readonly ConcurrentDictionary<string, HashSet<string>> _pageUsers = new();
    private static readonly TimeSpan _onlineTimeout = TimeSpan.FromMinutes(5);

    public AccessController(ISqlSugarClient db)
    {
        _db = db;
        // 清理过期用户
        CleanupOnlineUsers();
    }

    /// <summary>
    /// 获取访问统计
    /// </summary>
    [HttpGet("stats")]
    public async Task<Result<AccessStatsDto>> GetStats()
    {
        // 清理过期用户
        CleanupOnlineUsers();

        var totalVisits = await _db.Queryable<AccessLog>().CountAsync();
        var today = DateTime.Today;
        var todayVisits = await _db.Queryable<AccessLog>()
            .Where(it => it.AccessTime >= today)
            .CountAsync();

        // 获取今日独立IP数
        var uniqueIpsToday = await _db.Queryable<AccessLog>()
            .Where(it => it.AccessTime >= today)
            .Select(it => it.IpAddress)
            .Distinct()
            .CountAsync();

        // 获取最近在线用户
        var recentUsers = _onlineUsers
            .OrderByDescending(kv => kv.Value)
            .Take(20)
            .Select(kv => new OnlineUserDto
            {
                IpAddress = kv.Key,
                LastSeen = kv.Value
            })
            .ToList();

        // 获取各页面在线人数
        var pageOnlineUsers = _pageUsers.ToDictionary(
            kv => kv.Key,
            kv => (long)kv.Value.Count
        );

        return Result<AccessStatsDto>.Ok(new AccessStatsDto
        {
            TotalVisits = totalVisits,
            TodayVisits = todayVisits,
            OnlineUsers = _onlineUsers.Count,
            UniqueIps = uniqueIpsToday,
            RecentUsers = recentUsers,
            PageOnlineUsers = pageOnlineUsers
        });
    }

    /// <summary>
    /// 心跳接口 - 更新在线状态
    /// </summary>
    [HttpPost("heartbeat")]
    [AllowAnonymous]
    public async Task<Result> Heartbeat([FromBody] HeartbeatRequest? request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var sessionId = request?.SessionId ?? ip; // 优先使用sessionId，没有则用IP
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString();
        var page = request?.Page ?? "home";

        // 清理该SessionId之前的页面记录
        foreach (var key in _pageUsers.Keys.ToList())
        {
            _pageUsers[key].Remove(sessionId);
            if (_pageUsers[key].Count == 0)
                _pageUsers.TryRemove(key, out _);
        }

        // 更新页面在线用户
        if (!_pageUsers.ContainsKey(page))
            _pageUsers[page] = new HashSet<string>();
        _pageUsers[page].Add(sessionId);

        // 更新在线用户
        _onlineUsers[sessionId] = DateTime.Now;

        // 记录访问日志（采样，减少数据库压力，每分钟最多记录一次）
        var shouldLog = true;
        var lastLog = await _db.Queryable<AccessLog>()
            .Where(it => it.IpAddress == ip)
            .OrderBy(it => it.AccessTime, OrderByType.Desc)
            .FirstAsync();

        if (lastLog != null && (DateTime.Now - lastLog.AccessTime).TotalMinutes < 1)
        {
            shouldLog = false;
        }

        if (shouldLog)
        {
            await _db.Insertable(new AccessLog
            {
                IpAddress = ip,
                UserAgent = userAgent.Length > 500 ? userAgent[..500] : userAgent,
                AccessTime = DateTime.Now
            }).ExecuteCommandAsync();
        }

        return Result.Ok();
    }

    /// <summary>
    /// 获取在线用户列表
    /// </summary>
    [HttpGet("online")]
    public Result<List<OnlineUserDto>> GetOnlineUsers()
    {
        CleanupOnlineUsers();

        var users = _onlineUsers
            .OrderByDescending(kv => kv.Value)
            .Take(50)
            .Select(kv => new OnlineUserDto
            {
                IpAddress = kv.Key,
                LastSeen = kv.Value
            })
            .ToList();

        return Result<List<OnlineUserDto>>.Ok(users);
    }

    private void CleanupOnlineUsers()
    {
        var expired = DateTime.Now - _onlineTimeout;
        var keysToRemove = _onlineUsers
            .Where(kv => kv.Value < expired)
            .Select(kv => kv.Key)
            .ToList();

        foreach (var key in keysToRemove)
        {
            _onlineUsers.TryRemove(key, out _);
        }
    }
}

public class HeartbeatRequest
{
    public string? Page { get; set; }
    public string? SessionId { get; set; }
}
