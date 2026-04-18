using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_access_log")]
public class AccessLog
{
    [SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
    public long Id { get; set; }

    /// <summary>
    /// IP地址
    /// </summary>
    [SugarColumn(Length = 50)]
    public string IpAddress { get; set; } = string.Empty;

    /// <summary>
    /// 用户标识（如果登录的话）
    /// </summary>
    [SugarColumn(Length = 100, IsNullable = true)]
    public string? UserId { get; set; }

    /// <summary>
    /// 访问路径
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? Path { get; set; }

    /// <summary>
    /// 用户代理
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// 访问时间
    /// </summary>
    public DateTime AccessTime { get; set; } = DateTime.Now;
}
