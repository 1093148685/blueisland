using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_audit_log")]
public class AuditLog
{
    [SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
    public long Id { get; set; }

    /// <summary>
    /// 留言内容
    /// </summary>
    [SugarColumn(Length = 1000)]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 是否违规
    /// </summary>
    public bool IsViolated { get; set; }

    /// <summary>
    /// 违规原因
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? Reason { get; set; }

    /// <summary>
    /// 审核来源（frontend/backend）
    /// </summary>
    [SugarColumn(Length = 20)]
    public string Source { get; set; } = "backend";

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreateTime { get; set; } = DateTime.Now;
}
