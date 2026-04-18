using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_music_config")]
public class MusicConfig
{
    [SugarColumn(IsPrimaryKey = true)]
    public long Id { get; set; } = 1;

    /// <summary>
    /// 默认播放模式：loop=循环, sequential=顺序, random=随机
    /// </summary>
    [SugarColumn(Length = 20)]
    public string DefaultPlaybackMode { get; set; } = "loop";

    /// <summary>
    /// 默认音量 0-100
    /// </summary>
    public int DefaultVolume { get; set; } = 70;

    /// <summary>
    /// 是否启用音乐功能
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// 是否启用白噪音功能
    /// </summary>
    public bool AmbientEnabled { get; set; } = true;

    /// <summary>
    /// 白噪音音量 0-100
    /// </summary>
    public int AmbientVolume { get; set; } = 50;

    /// <summary>
    /// 海浪白噪音链接
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? AmbientWavesUrl { get; set; }

    /// <summary>
    /// 雨声白噪音链接
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? AmbientRainUrl { get; set; }

    /// <summary>
    /// 篝火白噪音链接
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? AmbientFireUrl { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? Remark { get; set; }
}
