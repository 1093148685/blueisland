using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_security_log")]
public class SecurityLog
{
    [SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
    public long Id { get; set; }

    /// <summary>
    /// 事件类型：RATE_LIMIT, IP_BLOCKED, SIGNATURE_FAIL, REFERRER_BLOCK, VIOLATION
    /// </summary>
    [SugarColumn(Length = 50)]
    public string? EventType { get; set; }

    /// <summary>
    /// IP 地址
    /// </summary>
    [SugarColumn(Length = 50)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// 请求路径
    /// </summary>
    [SugarColumn(Length = 500)]
    public string? Path { get; set; }

    /// <summary>
    /// 详细信息
    /// </summary>
    [SugarColumn(Length = 1000)]
    public string? Details { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreateTime { get; set; } = DateTime.Now;
}
