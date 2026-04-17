using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_ai_model")]
public class AiModel
{
    [SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
    public long Id { get; set; }

    /// <summary>
    /// 模型名称
    /// </summary>
    [SugarColumn(Length = 50, DefaultValue = "")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 模型类型（如 openai, claude, gemini 等）
    /// </summary>
    [SugarColumn(Length = 30, DefaultValue = "")]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// API Key
    /// </summary>
    [SugarColumn(Length = 500, DefaultValue = "")]
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// API 地址
    /// </summary>
    [SugarColumn(Length = 200, DefaultValue = "")]
    public string ApiUrl { get; set; } = string.Empty;

    /// <summary>
    /// 模型名称（如 gpt-4, claude-3, gemini-pro 等）
    /// </summary>
    [SugarColumn(Length = 50, DefaultValue = "")]
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// 是否默认模型
    /// </summary>
    public bool IsDefault { get; set; } = false;

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// 备注
    /// </summary>
    [SugarColumn(Length = 500, IsNullable = true)]
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreateTime { get; set; } = DateTime.Now;

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdateTime { get; set; } = DateTime.Now;
}
