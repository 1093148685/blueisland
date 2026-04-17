using SqlSugar;

namespace Core.Model.Entities;

[SugarTable("t_ai_config")]
public class AiConfig
{
    [SugarColumn(IsPrimaryKey = true)]
    public long Id { get; set; } = 1;

    /// <summary>
    /// 系统提示词
    /// </summary>
    [SugarColumn(Length = 2000)]
    public string SystemPrompt { get; set; } = "你是岛屿守护灵，语气治愈且神秘。";

    /// <summary>
    /// 审核提示词
    /// </summary>
    [SugarColumn(Length = 2000)]
    public string AuditPrompt { get; set; } = "你是一个严格的内容审核员。任何包含以下内容的留言都必须被拦截：1. 脏话、粗话、侮辱性词汇（如傻逼、混蛋、操等）2. 色情、低俗内容 3. 暴力、血腥内容 4. 仇恨言论、歧视性内容 5. 政治敏感内容 6. 广告、垃圾信息 7. 任何暗示性、擦边内容 即使是谐音字、缩写、表情符号形式的违规内容也要拦截。如果是违规内容，请输出具体的违规原因；如果完全安全，仅输出 'safe'。";

    /// <summary>
    /// 是否启用自动审核
    /// </summary>
    public bool AutoAudit { get; set; } = true;

    /// <summary>
    /// Temperature (随机性)
    /// </summary>
    public double Temperature { get; set; } = 0.7;

    /// <summary>
    /// 最大输出Token数
    /// </summary>
    public int MaxTokens { get; set; } = 200;

    /// <summary>
    /// 是否自动回复
    /// </summary>
    public bool AutoReply { get; set; } = true;
}
