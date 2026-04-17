using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Core.Common.Result;
using Core.Model.Entities;
using SqlSugar;

namespace BlueIsland.Api.Controllers;

[ApiController]
[Route("api/spirit")]
[AllowAnonymous]
public class SpiritController : ControllerBase
{
    private readonly ISqlSugarClient _db;

    public SpiritController(ISqlSugarClient db)
    {
        _db = db;
    }

    /// <summary>
    /// 与岛屿之灵对话
    /// </summary>
    [HttpPost("chat")]
    public async Task<Result<object>> Chat([FromBody] SpiritChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return Result<object>.Fail("消息不能为空");
        }

        try
        {
            var defaultModel = await _db.Queryable<AiModel>()
                .Where(it => it.IsDefault && it.IsEnabled)
                .FirstAsync();

            if (defaultModel == null)
            {
                return Result<object>.Fail("请先配置默认AI模型");
            }

            var reply = await GenerateSpiritReply(defaultModel, request.Message);
            return Result<object>.Ok(new { reply });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"岛屿之灵对话失败: {ex.Message}");
            return Result<object>.Fail($"岛屿之灵沉睡中...: {ex.Message}");
        }
    }

    private async Task<string> GenerateSpiritReply(AiModel model, string userMessage)
    {
        using var client = new HttpClient();
        client.Timeout = TimeSpan.FromSeconds(15);

        var apiUrl = model.ApiUrl.TrimEnd('/');
        if (!apiUrl.EndsWith("/chat/completions"))
        {
            apiUrl += "/chat/completions";
        }

        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {model.ApiKey}");

        // 获取系统提示词
        var config = await _db.Queryable<AiConfig>()
            .Where(it => it.Id == 1)
            .FirstAsync();

        var systemPrompt = config?.SystemPrompt ?? "你是岛屿守护灵，语气治愈且神秘。";

        var requestBody = new
        {
            model = model.Model,
            messages = new[]
            {
                new { role = "system", content = $"你是'岛屿之灵'，{systemPrompt} 你的回答简短且富有文学气息，神秘、温柔、治愈。字数控制在50字以内。" },
                new { role = "user", content = userMessage }
            },
            max_tokens = 150,
            temperature = config?.Temperature ?? 0.8
        };

        var response = await client.PostAsJsonAsync(apiUrl, requestBody);
        response.EnsureSuccessStatusCode();

        var jsonString = await response.Content.ReadAsStringAsync();
        var jsonDoc = System.Text.Json.JsonDocument.Parse(jsonString);

        if (jsonDoc.RootElement.TryGetProperty("choices", out var choices) &&
            choices.GetArrayLength() > 0)
        {
            var firstChoice = choices.EnumerateArray().FirstOrDefault();
            if (firstChoice.TryGetProperty("message", out var message) &&
                message.TryGetProperty("content", out var contentProp))
            {
                return contentProp.GetString()?.Trim() ?? "岛屿之灵正在沉思...";
            }
        }

        return "岛屿之灵正在沉思...";
    }
}

public class SpiritChatRequest
{
    public string Message { get; set; } = string.Empty;
}
