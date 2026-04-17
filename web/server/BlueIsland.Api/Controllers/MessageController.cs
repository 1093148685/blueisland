using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Core.Common.Helpers;
using Core.Common.Result;
using Core.Model.DTOs;
using Core.Model.Entities;
using Core.Model.Helpers;
using SqlSugar;

namespace BlueIsland.Api.Controllers;

[ApiController]
[Route("api/messages")]
public class MessageController : ControllerBase
{
    private readonly ISqlSugarClient _db;

    public MessageController(ISqlSugarClient db)
    {
        _db = db;
    }

    /// <summary>
    /// 获取所有留言（不显示私密内容）
    /// </summary>
    [HttpGet]
    public async Task<Result<MessageListResultDto>> GetMessages()
    {
        var messages = await _db.Queryable<Message>()
            .Where(it => !it.IsDeleted)
            .OrderByDescending(it => it.CreateTime)
            .Select(it => new MessageDto
            {
                Id = it.Id,
                Content = it.Content,
                SecretContent = "",
                AvatarType = it.AvatarType,
                AvatarId = it.AvatarId,
                AvatarUrl = it.AvatarUrl,
                CreateTime = it.CreateTime,
                IpLocation = it.IpLocation,
                DeviceType = it.DeviceType,
                Browser = it.Browser,
                IsUnlocked = false
            })
            .ToListAsync();

        return Result<MessageListResultDto>.Ok(new MessageListResultDto
        {
            Total = messages.Count,
            Messages = messages
        });
    }

    /// <summary>
    /// 根据暗号查询留言
    /// </summary>
    [HttpGet("{secretCode}")]
    public async Task<Result<MessageListResultDto>> GetMessagesBySecret(string secretCode)
    {
        var hashedCode = AesUtil.HashSha256(secretCode);

        var messages = await _db.Queryable<Message>()
            .Where(it => !it.IsDeleted && it.SecretCode == hashedCode)
            .OrderByDescending(it => it.CreateTime)
            .Select(it => new MessageDto
            {
                Id = it.Id,
                Content = it.Content,
                SecretContent = it.SecretContent,
                SecretCode = secretCode,
                AiEcho = it.AiEcho,
                AvatarType = it.AvatarType,
                AvatarId = it.AvatarId,
                AvatarUrl = it.AvatarUrl,
                CreateTime = it.CreateTime,
                IpLocation = it.IpLocation,
                DeviceType = it.DeviceType,
                Browser = it.Browser,
                IsUnlocked = true
            })
            .ToListAsync();

        return Result<MessageListResultDto>.Ok(new MessageListResultDto
        {
            Total = messages.Count,
            Messages = messages
        });
    }

    /// <summary>
    /// 发布留言
    /// </summary>
    [HttpPost]
    public async Task<Result<MessageDto>> CreateMessage([FromBody] CreateMessageRequest request)
    {
        var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
        var ipAddress = IpHelper.GetRealIpAddress(forwardedFor, realIp, HttpContext.Connection.RemoteIpAddress);
        var (deviceType, browser, os) = IpHelper.ParseUserAgent(Request.Headers.UserAgent.ToString());
        var ipLocation = IpHelper.GetIpLocation(ipAddress);

        string? encryptedSecretContent = null;
        if (!string.IsNullOrEmpty(request.SecretContent))
        {
            encryptedSecretContent = AesUtil.Encrypt(request.SecretContent, AesUtil.DeriveKey(request.SecretCode));
        }

        // 生成AI回复
        string? aiEcho = null;
        try
        {
            var defaultModel = await _db.Queryable<AiModel>()
                .Where(it => it.IsDefault && it.IsEnabled)
                .FirstAsync();

            if (defaultModel != null)
            {
                aiEcho = await GenerateAiEcho(defaultModel, request.Content);
            }
        }
        catch
        {
            // AI生成失败不影响留言创建
            aiEcho = "✨ 岛屿正在聆听...";
        }

        var message = new Message
        {
            Content = request.Content,
            SecretCode = AesUtil.HashSha256(request.SecretCode),
            SecretContent = encryptedSecretContent,
            AiEcho = aiEcho,
            AvatarType = request.AvatarType,
            AvatarId = request.AvatarId,
            AvatarUrl = request.AvatarUrl,
            CreateTime = DateTime.Now,
            IpAddress = ipAddress,
            IpLocation = ipLocation,
            DeviceType = deviceType,
            Browser = browser,
            IsDeleted = false
        };

        await _db.Insertable(message).ExecuteCommandAsync();

        return Result<MessageDto>.Ok(new MessageDto
        {
            Id = message.Id,
            Content = message.Content,
            SecretContent = "",
            AvatarType = message.AvatarType,
            AvatarId = message.AvatarId,
            AvatarUrl = message.AvatarUrl,
            CreateTime = message.CreateTime,
            IpLocation = message.IpLocation,
            DeviceType = message.DeviceType,
            Browser = message.Browser,
            IsUnlocked = false
        });
    }

    /// <summary>
    /// 解锁私密内容
    /// </summary>
    [HttpPost("unlock")]
    public async Task<Result<MessageDto>> UnlockMessage([FromBody] QueryMessageRequest request)
    {
        var hashedCode = AesUtil.HashSha256(request.SecretCode);

        var message = await _db.Queryable<Message>()
            .Where(it => !it.IsDeleted && it.SecretCode == hashedCode)
            .FirstAsync();

        if (message == null)
        {
            return Result<MessageDto>.Fail("暗号错误");
        }

        string? decryptedContent = null;
        if (!string.IsNullOrEmpty(message.SecretContent))
        {
            try
            {
                decryptedContent = AesUtil.Decrypt(message.SecretContent, AesUtil.DeriveKey(request.SecretCode));
            }
            catch
            {
                return Result<MessageDto>.Fail("解密失败");
            }
        }

        return Result<MessageDto>.Ok(new MessageDto
        {
            Id = message.Id,
            Content = message.Content,
            SecretContent = decryptedContent ?? message.Content,
            AvatarType = message.AvatarType,
            AvatarId = message.AvatarId,
            AvatarUrl = message.AvatarUrl,
            CreateTime = message.CreateTime,
            IpLocation = message.IpLocation,
            DeviceType = message.DeviceType,
            Browser = message.Browser,
            IsUnlocked = true
        });
    }

    /// <summary>
    /// 管理员获取所有留言（包含完整信息）
    /// </summary>
    [HttpGet("admin")]
    [Authorize(Roles = "admin")]
    public async Task<Result<MessageListResultDto>> GetAllMessagesForAdmin([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var total = await _db.Queryable<Message>()
            .Where(it => !it.IsDeleted)
            .CountAsync();

        var messages = await _db.Queryable<Message>()
            .Where(it => !it.IsDeleted)
            .OrderByDescending(it => it.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(it => new MessageDto
            {
                Id = it.Id,
                Content = it.Content,
                SecretContent = it.SecretContent,
                AvatarType = it.AvatarType,
                AvatarId = it.AvatarId,
                AvatarUrl = it.AvatarUrl,
                CreateTime = it.CreateTime,
                IpAddress = it.IpAddress,
                IpLocation = it.IpLocation,
                DeviceType = it.DeviceType,
                Browser = it.Browser,
                IsUnlocked = true
            })
            .ToListAsync();

        return Result<MessageListResultDto>.Ok(new MessageListResultDto
        {
            Total = total,
            Messages = messages
        });
    }

    /// <summary>
    /// 管理员删除留言
    /// </summary>
    [HttpDelete("admin/{id}")]
    [Authorize(Roles = "admin")]
    public async Task<Result> DeleteMessage(long id)
    {
        try
        {
            var message = await _db.Queryable<Message>()
                .Where(it => it.Id == id && !it.IsDeleted)
                .FirstAsync();

            if (message == null)
            {
                return Result.Fail("留言不存在");
            }

            message.IsDeleted = true;
            await _db.Updateable(message).ExecuteCommandAsync();

            return Result.Ok();
        }
        catch (Exception ex)
        {
            return Result.Fail(ex.Message);
        }
    }

    /// <summary>
    /// 管理员更新留言
    /// </summary>
    [HttpPut("admin/{id}")]
    [Authorize(Roles = "admin")]
    public async Task<Result<MessageDto>> UpdateMessage(long id, [FromBody] UpdateMessageRequest request)
    {
        try
        {
            var message = await _db.Queryable<Message>()
                .Where(it => it.Id == id && !it.IsDeleted)
                .FirstAsync();

            if (message == null)
            {
                return Result<MessageDto>.Fail("留言不存在");
            }

            message.Content = request.Content;
            await _db.Updateable(message).ExecuteCommandAsync();

            return Result<MessageDto>.Ok(new MessageDto
            {
                Id = message.Id,
                Content = message.Content,
                SecretContent = message.SecretContent,
                AvatarType = message.AvatarType,
                AvatarId = message.AvatarId,
                AvatarUrl = message.AvatarUrl,
                CreateTime = message.CreateTime,
                IpAddress = message.IpAddress,
                IpLocation = message.IpLocation,
                DeviceType = message.DeviceType,
                Browser = message.Browser,
                IsUnlocked = true
            });
        }
        catch (Exception ex)
        {
            return Result<MessageDto>.Fail(ex.Message);
        }
    }

    private async Task<string> GenerateAiEcho(AiModel model, string content)
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
                new { role = "system", content = "你是一个深夜的聆听者，给这段心事写一个温柔的简短回响，15字以内。" },
                new { role = "user", content = content }
            },
            max_tokens = 50
        };

        var response = await client.PostAsJsonAsync(apiUrl, requestBody);
        response.EnsureSuccessStatusCode();

        var jsonString = await response.Content.ReadAsStringAsync();
        var jsonDoc = System.Text.Json.JsonDocument.Parse(jsonString);

        if (jsonDoc.RootElement.TryGetProperty("choices", out var choices) &&
            choices.GetArrayLength() > 0)
        {
            var firstChoice = choices[0];
            if (firstChoice.TryGetProperty("message", out var message) &&
                message.TryGetProperty("content", out var contentProp))
            {
                return contentProp.GetString()?.Trim() ?? "✨ 岛屿正在聆听...";
            }
        }

        return "✨ 岛屿正在聆听...";
    }

    /// <summary>
    /// 获取今日寄语（AI根据全岛留言氛围生成）
    /// </summary>
    [HttpGet("daily-quote")]
    [AllowAnonymous]
    public async Task<Result<object>> GetDailyQuote()
    {
        try
        {
            // 获取最近30条留言
            var messages = await _db.Queryable<Message>()
                .Where(it => !it.IsDeleted)
                .OrderByDescending(it => it.CreateTime)
                .Take(30)
                .Select(it => it.Content)
                .ToListAsync();

            if (messages.Count == 0)
            {
                return Result<object>.Ok(new
                {
                    quote = "岛屿正在等待第一位岛民的到来...",
                    mood = "peaceful"
                });
            }

            var defaultModel = await _db.Queryable<AiModel>()
                .Where(it => it.IsDefault && it.IsEnabled)
                .FirstAsync();

            if (defaultModel == null)
            {
                return Result<object>.Ok(new
                {
                    quote = "今日岛屿：愿每颗心都能找到栖息之所",
                    mood = "peaceful"
                });
            }

            var quote = await GenerateDailyQuote(defaultModel, messages);
            return Result<object>.Ok(new { quote });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"生成今日寄语失败: {ex.Message}");
            return Result<object>.Ok(new
            {
                quote = "今日岛屿：愿每颗心都能找到栖息之所",
                mood = "peaceful"
            });
        }
    }

    private async Task<string> GenerateDailyQuote(AiModel model, List<string> messages)
    {
        using var client = new HttpClient();
        client.Timeout = TimeSpan.FromSeconds(15);

        var apiUrl = model.ApiUrl.TrimEnd('/');
        if (!apiUrl.EndsWith("/chat/completions"))
        {
            apiUrl += "/chat/completions";
        }

        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {model.ApiKey}");

        var messagesPreview = string.Join("\n", messages.Take(10));

        var requestBody = new
        {
            model = model.Model,
            messages = new[]
            {
                new { role = "system", content = "你是岛屿守护灵，感知着每一位岛民的心事。你需要根据下面的留言内容，用诗意的语言生成一句\"今日寄语\"（20字以内），温暖治愈。不要提及具体留言内容。格式：只需输出寄语文字，不要其他说明。" },
                new { role = "user", content = $"最近的留言：\n{messagesPreview}\n\n请根据这些留言的氛围，生成今日寄语：" }
            },
            max_tokens = 50,
            temperature = 0.8
        };

        var response = await client.PostAsJsonAsync(apiUrl, requestBody);
        response.EnsureSuccessStatusCode();

        var jsonString = await response.Content.ReadAsStringAsync();
        var jsonDoc = System.Text.Json.JsonDocument.Parse(jsonString);

        if (jsonDoc.RootElement.TryGetProperty("choices", out var choices) &&
            choices.GetArrayLength() > 0)
        {
            var firstChoice = choices[0];
            if (firstChoice.TryGetProperty("message", out var message) &&
                message.TryGetProperty("content", out var contentProp))
            {
                var result = contentProp.GetString()?.Trim() ?? "今日岛屿：愿每颗心都能找到栖息之所";
                // 清理可能的引号
                result = result.Trim('"', '。', '：', ':');
                return result.Length > 25 ? result[..25] : result;
            }
        }

        return "今日岛屿：愿每颗心都能找到栖息之所";
    }

    /// <summary>
    /// 分析岛屿情绪
    /// </summary>
    [HttpPost("analyze-mood")]
    [AllowAnonymous]
    public async Task<Result<object>> AnalyzeMood([FromBody] AnalyzeMoodRequest request)
    {
        try
        {
            var defaultModel = await _db.Queryable<AiModel>()
                .Where(it => it.IsDefault && it.IsEnabled)
                .FirstAsync();

            if (defaultModel == null)
            {
                return Result<object>.Ok(new
                {
                    quote = "今日岛屿：愿每颗心都能找到栖息之所",
                    mood = "peaceful",
                    color = "rgba(5, 22, 42, 0.8)",
                    weather = "微风",
                    intensity = 1
                });
            }

            var result = await GenerateMoodAnalysis(defaultModel, request.Context);
            return Result<object>.Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"分析岛屿情绪失败: {ex.Message}");
            return Result<object>.Ok(new
            {
                quote = "今日岛屿：愿每颗心都能找到栖息之所",
                mood = "peaceful",
                color = "rgba(5, 22, 42, 0.8)",
                weather = "微风",
                intensity = 1
            });
        }
    }

    private async Task<object> GenerateMoodAnalysis(AiModel model, string context)
    {
        using var client = new HttpClient();
        client.Timeout = TimeSpan.FromSeconds(15);

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
                new { role = "system", content = "你是岛屿守护灵，感知着每一位岛民的心事。请分析这些留言的情绪，返回JSON格式：{\"quote\": \"一句温柔的寄语(20字以内)\", \"mood\": \"情绪关键词\", \"color\": \"一个适合这种情绪的rgba颜色如rgba(5,22,42,0.8)\", \"weather\": \"一种天气如细雨、星空、晚霞、微风、晨雾\", \"intensity\": 0.5-1之间的数值}" },
                new { role = "user", content = $"分析这些留言的情绪：{context}" }
            },
            max_tokens = 100,
            temperature = 0.8
        };

        var response = await client.PostAsJsonAsync(apiUrl, requestBody);
        response.EnsureSuccessStatusCode();

        var jsonString = await response.Content.ReadAsStringAsync();
        var jsonDoc = System.Text.Json.JsonDocument.Parse(jsonString);

        if (jsonDoc.RootElement.TryGetProperty("choices", out var choices) &&
            choices.GetArrayLength() > 0)
        {
            var firstChoice = choices[0];
            if (firstChoice.TryGetProperty("message", out var message) &&
                message.TryGetProperty("content", out var contentProp))
            {
                var text = contentProp.GetString()?.Trim() ?? "";
                // 尝试解析 JSON
                try
                {
                    var cleanText = text.Replace("```json", "").Replace("```", "").Trim();
                    var data = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(cleanText);
                    return new
                    {
                        quote = data.TryGetProperty("quote", out var q) ? q.GetString() : "今日岛屿：愿每颗心都能找到栖息之所",
                        mood = data.TryGetProperty("mood", out var m) ? m.GetString() : "peaceful",
                        color = data.TryGetProperty("color", out var c) ? c.GetString() : "rgba(5, 22, 42, 0.8)",
                        weather = data.TryGetProperty("weather", out var w) ? w.GetString() : "微风",
                        intensity = data.TryGetProperty("intensity", out var i) ? i.GetDouble() : 0.8
                    };
                }
                catch
                {
                    // 解析失败，返回默认值
                }
            }
        }

        return new
        {
            quote = "今日岛屿：愿每颗心都能找到栖息之所",
            mood = "peaceful",
            color = "rgba(5, 22, 42, 0.8)",
            weather = "微风",
            intensity = 0.8
        };
    }
}
