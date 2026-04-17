using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_sys_user")]
public class SysUser
{
    [SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
    public long Id { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    [SugarColumn(Length = 60)]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密码（BCrypt哈希存储）
    /// </summary>
    [SugarColumn(Length = 60)]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 角色：admin-管理员, visitor-访客
    /// </summary>
    [SugarColumn(Length = 20)]
    public string Role { get; set; } = "admin";

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreateTime { get; set; } = DateTime.Now;

    /// <summary>
    /// 最后一次更新时间
    /// </summary>
    public DateTime UpdateTime { get; set; } = DateTime.Now;

    /// <summary>
    /// 删除标志位
    /// </summary>
    public bool IsDeleted { get; set; }
}
