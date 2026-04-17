using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Core.Common.Result;
using Core.Model.DTOs;
using Core.Model.Entities;
using SqlSugar;

namespace BlueIsland.Api.Controllers;

[ApiController]
[Route("api/ai-config")]
[Authorize(Roles = "admin")]
public class AiConfigController : ControllerBase
{
    private readonly ISqlSugarClient _db;

    public AiConfigController(ISqlSugarClient db)
    {
        _db = db;
    }

    /// <summary>
    /// 获取AI配置
    /// </summary>
    [HttpGet]
    public async Task<Result<AiConfigDto>> GetConfig()
    {
        var config = await _db.Queryable<AiConfig>()
            .Where(it => it.Id == 1)
            .FirstAsync();

        Console.WriteLine($"[DEBUG] GetConfig: config is null = {config == null}");
        if (config != null)
        {
            Console.WriteLine($"[DEBUG] GetConfig: AutoAudit = {config.AutoAudit}");
        }

        if (config == null)
        {
            config = new AiConfig { Id = 1 };
            await _db.Insertable(config).ExecuteCommandAsync();
            Console.WriteLine($"[DEBUG] GetConfig: Created new config with AutoAudit = {config.AutoAudit}");
        }

        return Result<AiConfigDto>.Ok(new AiConfigDto
        {
            Id = config.Id,
            SystemPrompt = config.SystemPrompt,
            AuditPrompt = config.AuditPrompt,
            AutoAudit = config.AutoAudit,
            Temperature = config.Temperature,
            MaxTokens = config.MaxTokens,
            AutoReply = config.AutoReply
        });
    }

    /// <summary>
    /// 保存AI配置
    /// </summary>
    [HttpPost]
    public async Task<Result<AiConfigDto>> SaveConfig([FromBody] AiConfigDto dto)
    {
        Console.WriteLine($"[DEBUG] SaveConfig called. dto.AutoAudit = {dto.AutoAudit}");

        var config = await _db.Queryable<AiConfig>()
            .Where(it => it.Id == 1)
            .FirstAsync();

        Console.WriteLine($"[DEBUG] config from DB is null: {config == null}");

        if (config == null)
        {
            config = new AiConfig { Id = 1 };
        }

        config.SystemPrompt = dto.SystemPrompt;
        config.AuditPrompt = dto.AuditPrompt;
        config.AutoAudit = dto.AutoAudit;
        config.Temperature = dto.Temperature;
        config.MaxTokens = dto.MaxTokens;
        config.AutoReply = dto.AutoReply;

        Console.WriteLine($"[DEBUG] After setting, config.AutoAudit = {config.AutoAudit}");

        // 检查是否存在
        var exists = await _db.Queryable<AiConfig>().Where(it => it.Id == 1).AnyAsync();
        Console.WriteLine($"[DEBUG] exists = {exists}");

        if (exists)
        {
            var rows = await _db.Updateable(config)
                .UpdateColumns(it => new { it.SystemPrompt, it.AuditPrompt, it.AutoAudit, it.Temperature, it.MaxTokens, it.AutoReply })
                .Where(it => it.Id == 1)
                .ExecuteCommandAsync();
            Console.WriteLine($"[DEBUG] Update rows affected: {rows}");
        }
        else
        {
            await _db.Insertable(config).ExecuteCommandAsync();
            Console.WriteLine($"[DEBUG] Inserted new config");
        }

        Console.WriteLine($"[DEBUG] Final config.AutoAudit = {config.AutoAudit}");

        return Result<AiConfigDto>.Ok(new AiConfigDto
        {
            Id = config.Id,
            SystemPrompt = config.SystemPrompt,
            AuditPrompt = config.AuditPrompt,
            AutoAudit = config.AutoAudit,
            Temperature = config.Temperature,
            MaxTokens = config.MaxTokens,
            AutoReply = config.AutoReply
        });
    }

    /// <summary>
    /// 获取审核统计
    /// </summary>
    [HttpGet("stats")]
    public async Task<Result<object>> GetStats()
    {
        var total = await _db.Queryable<AuditLog>().CountAsync();
        var violated = await _db.Queryable<AuditLog>().Where(it => it.IsViolated).CountAsync();
        var frontendBlocked = await _db.Queryable<AuditLog>().Where(it => it.Source == "frontend" && it.IsViolated).CountAsync();
        var backendBlocked = await _db.Queryable<AuditLog>().Where(it => it.Source == "backend" && it.IsViolated).CountAsync();

        return Result<object>.Ok(new
        {
            total,
            violated,
            frontendBlocked,
            backendBlocked,
            passed = total - violated
        });
    }

    /// <summary>
    /// 获取审核日志
    /// </summary>
    [HttpGet("logs")]
    public async Task<Result<List<AuditLog>>> GetLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var logs = await _db.Queryable<AuditLog>()
            .OrderByDescending(it => it.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<List<AuditLog>>.Ok(logs);
    }

    /// <summary>
    /// 记录前端拦截（公开接口，无需登录）
    /// </summary>
    [HttpPost("log-blocked")]
    [AllowAnonymous]
    public async Task<Result> LogFrontendBlocked([FromBody] System.Text.Json.JsonElement request)
    {
        string content = "";
        if (request.TryGetProperty("content", out var contentElement))
        {
            content = contentElement.GetString() ?? "";
        }

        await LogAudit(content, true, "敏感词拦截", "frontend");

        return Result.Ok();
    }

    /// <summary>
    /// 审核留言（公开接口，无需登录）
    /// </summary>
    [HttpPost("audit")]
    [AllowAnonymous]
    public async Task<Result<AuditResult>> AuditMessage([FromBody] System.Text.Json.JsonElement request)
    {
        string content = "";
        if (request.TryGetProperty("content", out var contentElement))
        {
            content = contentElement.GetString() ?? "";
        }

        bool isViolated = false;
        string reason = "";

        if (string.IsNullOrEmpty(content))
        {
            return Result<AuditResult>.Ok(new AuditResult { IsViolated = false, Reason = "" });
        }

        var config = await _db.Queryable<AiConfig>()
            .Where(it => it.Id == 1)
            .FirstAsync();

        if (config == null)
        {
            config = new AiConfig { Id = 1 };
            await _db.Insertable(config).ExecuteCommandAsync();
        }

        if (!config.AutoAudit)
        {
            // 自动审核未启用，直接跳过（不记录日志，不拦截）
            return Result<AuditResult>.Ok(new AuditResult { IsViolated = false, Reason = "", Skipped = true });
        }

        try
        {
            var defaultModel = await _db.Queryable<AiModel>()
                .Where(it => it.IsDefault && it.IsEnabled)
                .FirstAsync();

            if (defaultModel == null)
            {
                await LogAudit(content, true, "请先在后台配置默认的AI模型", "frontend");
                return Result<AuditResult>.Fail("请先在后台配置默认的AI模型");
            }

            var auditResult = await PerformAudit(defaultModel, config.AuditPrompt, content);
            isViolated = auditResult.IsViolated;
            reason = auditResult.Reason;

            await LogAudit(content, isViolated, reason, "backend");

            return Result<AuditResult>.Ok(auditResult);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AI审核失败: {ex.Message}");
            await LogAudit(content, true, $"AI审核服务异常: {ex.Message}", "backend");
            return Result<AuditResult>.Fail($"AI审核服务异常: {ex.Message}");
        }
    }

    private async Task LogAudit(string content, bool isViolated, string reason, string source)
    {
        try
        {
            await _db.Insertable(new AuditLog
            {
                Content = content.Length > 200 ? content[..200] : content,
                IsViolated = isViolated,
                Reason = reason,
                Source = source,
                CreateTime = DateTime.Now
            }).ExecuteCommandAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"记录审核日志失败: {ex.Message}");
        }
    }

    private async Task<AuditResult> PerformAudit(AiModel model, string auditPrompt, string content)
    {
        using var client = new HttpClient();
        client.Timeout = TimeSpan.FromSeconds(10);

        var apiUrl = model.ApiUrl.TrimEnd('/');
        if (!apiUrl.EndsWith("/chat/completions"))
        {
            apiUrl += "/chat/completions";
        }

        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {model.ApiKey}");

        var requestBody = new
        {
            model = model.Model,
            messages = new[]
            {
                new { role = "system", content = $"审核规则: {auditPrompt}" },
                new { role = "user", content = content }
            },
            max_tokens = 100
        };

        var response = await client.PostAsJsonAsync(apiUrl, requestBody);
        response.EnsureSuccessStatusCode();

        var jsonString = await response.Content.ReadAsStringAsync();
        var jsonDoc = System.Text.Json.JsonDocument.Parse(jsonString);

        var resultText = "";
        if (jsonDoc.RootElement.TryGetProperty("choices", out var choices) &&
            choices.GetArrayLength() > 0)
        {
            var firstChoice = choices[0];
            if (firstChoice.TryGetProperty("message", out var message) &&
                message.TryGetProperty("content", out var contentProp))
            {
                resultText = contentProp.GetString()?.Trim() ?? "";
            }
        }

        var isViolated = !resultText.Equals("safe", StringComparison.OrdinalIgnoreCase);

        return new AuditResult
        {
            IsViolated = isViolated,
            Reason = isViolated ? resultText : ""
        };
    }
}
