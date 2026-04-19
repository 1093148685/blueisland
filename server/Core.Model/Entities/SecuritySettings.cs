using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_security_settings")]
public class SecuritySettings
{
    [SugarColumn(IsPrimaryKey = true)]
    public long Id { get; set; } = 1;

    /// <summary>
    /// 每分钟允许的最大请求数
    /// </summary>
    public int MaxRequestsPerMinute { get; set; } = 100;

    /// <summary>
    /// 触发临时封禁的违规次数
    /// </summary>
    public int ViolationThreshold { get; set; } = 3;

    /// <summary>
    /// 临时封禁时长（分钟）
    /// </summary>
    public int BanDurationMinutes { get; set; } = 5;

    /// <summary>
    /// 是否启用签名校验
    /// </summary>
    public bool EnableSignatureCheck { get; set; } = true;

    /// <summary>
    /// 是否启用 Referer 检查
    /// </summary>
    public bool EnableRefererCheck { get; set; } = false;

    /// <summary>
    /// 允许的域名（逗号分隔）
    /// </summary>
    [SugarColumn(Length = 1000)]
    public string? AllowedRefererDomains { get; set; } = "localhost:5174,localhost:3000";

    /// <summary>
    /// 是否启用 IP 黑名单
    /// </summary>
    public bool EnableIpBlockList { get; set; } = true;

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdateTime { get; set; } = DateTime.Now;
}
