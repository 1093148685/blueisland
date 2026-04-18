using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_music_log")]
public class MusicLog
{
    [SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
    public long Id { get; set; }

    /// <summary>
    /// 操作类型：search=搜索, play=播放, error=错误
    /// </summary>
    [SugarColumn(Length = 20)]
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// 歌曲名称
    /// </summary>
    [SugarColumn(Length = 200, IsNullable = true)]
    public string? SongName { get; set; }

    /// <summary>
    /// 歌曲ID
    /// </summary>
    [SugarColumn(Length = 100, IsNullable = true)]
    public string? SongId { get; set; }

    /// <summary>
    /// 歌曲来源
    /// </summary>
    [SugarColumn(Length = 50, IsNullable = true)]
    public string? Source { get; set; }

    /// <summary>
    /// 状态：success=成功, failed=失败
    /// </summary>
    [SugarColumn(Length = 20)]
    public string Status { get; set; } = "success";

    /// <summary>
    /// 错误信息
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// IP地址
    /// </summary>
    [SugarColumn(Length = 50, IsNullable = true)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreateTime { get; set; } = DateTime.Now;
}
