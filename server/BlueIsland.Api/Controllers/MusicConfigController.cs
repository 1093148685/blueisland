using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Core.Common.Result;
using Core.Model.DTOs;
using Core.Model.Entities;
using SqlSugar;

namespace BlueIsland.Api.Controllers;

[ApiController]
[Route("api/music-config")]
[Authorize(Roles = "admin")]
public class MusicConfigController : ControllerBase
{
    private readonly ISqlSugarClient _db;

    public MusicConfigController(ISqlSugarClient db)
    {
        _db = db;
    }

    /// <summary>
    /// 获取音乐配置
    /// </summary>
    [HttpGet]
    public async Task<Result<MusicConfigDto>> GetConfig()
    {
        var config = await _db.Queryable<MusicConfig>()
            .Where(it => it.Id == 1)
            .FirstAsync();

        if (config == null)
        {
            config = new MusicConfig { Id = 1 };
            await _db.Insertable(config).ExecuteCommandAsync();
        }

        return Result<MusicConfigDto>.Ok(new MusicConfigDto
        {
            Id = config.Id,
            DefaultPlaybackMode = config.DefaultPlaybackMode,
            DefaultVolume = config.DefaultVolume,
            Enabled = config.Enabled,
            AmbientEnabled = config.AmbientEnabled,
            AmbientVolume = config.AmbientVolume,
            AmbientWavesUrl = config.AmbientWavesUrl,
            AmbientRainUrl = config.AmbientRainUrl,
            AmbientFireUrl = config.AmbientFireUrl,
            Remark = config.Remark
        });
    }

    /// <summary>
    /// 保存音乐配置
    /// </summary>
    [HttpPost]
    public async Task<Result<MusicConfigDto>> SaveConfig([FromBody] MusicConfigDto dto)
    {
        var config = await _db.Queryable<MusicConfig>()
            .Where(it => it.Id == 1)
            .FirstAsync();

        if (config == null)
        {
            config = new MusicConfig { Id = 1 };
        }

        config.DefaultPlaybackMode = dto.DefaultPlaybackMode;
        config.DefaultVolume = dto.DefaultVolume;
        config.Enabled = dto.Enabled;
        config.AmbientEnabled = dto.AmbientEnabled;
        config.AmbientVolume = dto.AmbientVolume;
        config.AmbientWavesUrl = dto.AmbientWavesUrl;
        config.AmbientRainUrl = dto.AmbientRainUrl;
        config.AmbientFireUrl = dto.AmbientFireUrl;
        config.Remark = dto.Remark;

        var exists = await _db.Queryable<MusicConfig>().Where(it => it.Id == 1).AnyAsync();

        if (exists)
        {
            await _db.Updateable(config)
                .UpdateColumns(it => new { it.DefaultPlaybackMode, it.DefaultVolume, it.Enabled, it.AmbientEnabled, it.AmbientVolume, it.AmbientWavesUrl, it.AmbientRainUrl, it.AmbientFireUrl, it.Remark })
                .Where(it => it.Id == 1)
                .ExecuteCommandAsync();
        }
        else
        {
            await _db.Insertable(config).ExecuteCommandAsync();
        }

        return Result<MusicConfigDto>.Ok(new MusicConfigDto
        {
            Id = config.Id,
            DefaultPlaybackMode = config.DefaultPlaybackMode,
            DefaultVolume = config.DefaultVolume,
            Enabled = config.Enabled,
            AmbientEnabled = config.AmbientEnabled,
            AmbientVolume = config.AmbientVolume,
            AmbientWavesUrl = config.AmbientWavesUrl,
            AmbientRainUrl = config.AmbientRainUrl,
            AmbientFireUrl = config.AmbientFireUrl,
            Remark = config.Remark
        });
    }

    /// <summary>
    /// 获取音乐统计
    /// </summary>
    [HttpGet("stats")]
    public async Task<Result<MusicStatsDto>> GetStats()
    {
        var totalSearches = await _db.Queryable<MusicLog>().Where(it => it.Action == "search").CountAsync();
        var totalPlays = await _db.Queryable<MusicLog>().Where(it => it.Action == "play").CountAsync();
        var totalErrors = await _db.Queryable<MusicLog>().Where(it => it.Action == "error" || it.Status == "failed").CountAsync();

        var today = DateTime.Today;
        var todaySearches = await _db.Queryable<MusicLog>()
            .Where(it => it.Action == "search" && it.CreateTime >= today)
            .CountAsync();
        var todayPlays = await _db.Queryable<MusicLog>()
            .Where(it => it.Action == "play" && it.CreateTime >= today)
            .CountAsync();

        var recentLogs = await _db.Queryable<MusicLog>()
            .OrderByDescending(it => it.CreateTime)
            .Take(50)
            .ToListAsync();

        return Result<MusicStatsDto>.Ok(new MusicStatsDto
        {
            TotalSearches = totalSearches,
            TotalPlays = totalPlays,
            TotalErrors = totalErrors,
            TodaySearches = todaySearches,
            TodayPlays = todayPlays,
            RecentLogs = recentLogs.Select(it => new MusicLogDto
            {
                Id = it.Id,
                Action = it.Action,
                SongName = it.SongName,
                SongId = it.SongId,
                Source = it.Source,
                Status = it.Status,
                ErrorMessage = it.ErrorMessage,
                IpAddress = it.IpAddress,
                CreateTime = it.CreateTime
            }).ToList()
        });
    }

    /// <summary>
    /// 获取音乐日志
    /// </summary>
    [HttpGet("logs")]
    public async Task<Result<List<MusicLogDto>>> GetLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var logs = await _db.Queryable<MusicLog>()
            .OrderByDescending(it => it.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<List<MusicLogDto>>.Ok(logs.Select(it => new MusicLogDto
        {
            Id = it.Id,
            Action = it.Action,
            SongName = it.SongName,
            SongId = it.SongId,
            Source = it.Source,
            Status = it.Status,
            ErrorMessage = it.ErrorMessage,
            IpAddress = it.IpAddress,
            CreateTime = it.CreateTime
        }).ToList());
    }

    /// <summary>
    /// 记录音乐操作（公开接口）
    /// </summary>
    [HttpPost("log")]
    [AllowAnonymous]
    public async Task<Result> LogMusicAction([FromBody] MusicLogRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        await _db.Insertable(new MusicLog
        {
            Action = request.Action,
            SongName = request.SongName,
            SongId = request.SongId,
            Source = request.Source,
            Status = request.Status,
            ErrorMessage = request.ErrorMessage,
            IpAddress = ip,
            CreateTime = DateTime.Now
        }).ExecuteCommandAsync();

        return Result.Ok();
    }
}
