using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_email_config")]
public class EmailConfig
{
    [SugarColumn(IsPrimaryKey = true)]
    public long Id { get; set; } = 1;

    /// <summary>
    /// SMTP 服务器地址
    /// </summary>
    [SugarColumn(Length = 200, IsNullable = true)]
    public string? SmtpHost { get; set; }

    /// <summary>
    /// SMTP 端口
    /// </summary>
    public int SmtpPort { get; set; } = 587;

    /// <summary>
    /// 是否启用 SSL
    /// </summary>
    public bool EnableSsl { get; set; } = true;

    /// <summary>
    /// 发件人邮箱
    /// </summary>
    [SugarColumn(Length = 200, IsNullable = true)]
    public string? FromEmail { get; set; }

    /// <summary>
    /// 发件人名称
    /// </summary>
    [SugarColumn(Length = 100, IsNullable = true)]
    public string? FromName { get; set; }

    /// <summary>
    /// SMTP 用户名
    /// </summary>
    [SugarColumn(Length = 200, IsNullable = true)]
    public string? SmtpUsername { get; set; }

    /// <summary>
    /// SMTP 密码
    /// </summary>
    [SugarColumn(Length = 200, IsNullable = true)]
    public string? SmtpPassword { get; set; }

    /// <summary>
    /// 是否启用邮箱通知功能
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// 备注
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? Remark { get; set; }
}
