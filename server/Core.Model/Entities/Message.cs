using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_message")]
public class Message
{
    [SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
    public long Id { get; set; }

    /// <summary>
    /// 留言内容（公开显示）
    /// </summary>
    [SugarColumn(Length = 300)]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 暗号（哈希存储）
    /// </summary>
    [SugarColumn(Length = 255)]
    public string SecretCode { get; set; } = string.Empty;

    /// <summary>
    /// 加密的私密内容
    /// </summary>
    [SugarColumn(Length = 2000, IsNullable = true)]
    public string? SecretContent { get; set; }

    /// <summary>
    /// AI回复
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? AiEcho { get; set; }

    /// <summary>
    /// 头像类型
    /// </summary>
    [SugarColumn(Length = 20)]
    public string AvatarType { get; set; } = "anonymous";

    /// <summary>
    /// 头像ID
    /// </summary>
    [SugarColumn(Length = 20)]
    public string AvatarId { get; set; } = "1";

    /// <summary>
    /// 头像URL
    /// </summary>
    [SugarColumn(Length = 160, IsNullable = true)]
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreateTime { get; set; } = DateTime.Now;

    /// <summary>
    /// 是否删除
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// IP地址
    /// </summary>
    [SugarColumn(Length = 64, IsNullable = true)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// IP属地
    /// </summary>
    [SugarColumn(Length = 64, IsNullable = true)]
    public string? IpLocation { get; set; }

    /// <summary>
    /// 设备类型
    /// </summary>
    [SugarColumn(Length = 32, IsNullable = true)]
    public string? DeviceType { get; set; }

    /// <summary>
    /// 浏览器
    /// </summary>
    [SugarColumn(Length = 64, IsNullable = true)]
    public string? Browser { get; set; }
}
