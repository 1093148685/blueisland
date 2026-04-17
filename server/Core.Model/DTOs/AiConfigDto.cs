using System.Text.Json.Serialization;

namespace Core.Model.DTOs;

public class AiConfigDto
{
    public long Id { get; set; } = 1;
    public string SystemPrompt { get; set; } = "你是岛屿守护灵，语气治愈且神秘。";
    public string AuditPrompt { get; set; } = "如果是违规内容（色情、暴力、仇恨言论），请输出具体的违规原因；如果是安全的，仅输出 'safe'。";
    public bool AutoAudit { get; set; } = true;
    public double Temperature { get; set; } = 0.7;
    public int MaxTokens { get; set; } = 200;
    public bool AutoReply { get; set; } = true;
}

public class AuditRequest
{
    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;
}

public class AuditResult
{
    public bool IsViolated { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool Skipped { get; set; }
}
