using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Core.Common.Result;
using Core.Model.DTOs;
using Core.Model.Entities;
using SqlSugar;

namespace BlueIsland.Api.Controllers;

[ApiController]
[Route("api/ai-models")]
[Authorize]
public class AiModelController : ControllerBase
{
    private readonly ISqlSugarClient _db;

    public AiModelController(ISqlSugarClient db)
    {
        _db = db;
    }

    /// <summary>
    /// 获取所有AI模型
    /// </summary>
    [HttpGet]
    public async Task<Result<List<AiModelDto>>> GetAiModels()
    {
        var models = await _db.Queryable<AiModel>()
            .OrderBy(it => new { it.IsDefault, it.CreateTime }, OrderByType.Desc)
            .Select(it => new AiModelDto
            {
                Id = it.Id,
                Name = it.Name,
                Type = it.Type,
                ApiKey = it.ApiKey,
                ApiUrl = it.ApiUrl,
                Model = it.Model,
                IsDefault = it.IsDefault,
                IsEnabled = it.IsEnabled,
                Remark = it.Remark,
                CreateTime = it.CreateTime,
                UpdateTime = it.UpdateTime
            })
            .ToListAsync();

        return Result<List<AiModelDto>>.Ok(models);
    }

    /// <summary>
    /// 获取默认AI模型
    /// </summary>
    [HttpGet("default")]
    public async Task<Result<AiModelDto>> GetDefaultAiModel()
    {
        var model = await _db.Queryable<AiModel>()
            .Where(it => it.IsDefault && it.IsEnabled)
            .FirstAsync();

        if (model == null)
        {
            return Result<AiModelDto>.Fail("未设置默认模型");
        }

        return Result<AiModelDto>.Ok(new AiModelDto
        {
            Id = model.Id,
            Name = model.Name,
            Type = model.Type,
            ApiKey = model.ApiKey,
            ApiUrl = model.ApiUrl,
            Model = model.Model,
            IsDefault = model.IsDefault,
            IsEnabled = model.IsEnabled,
            Remark = model.Remark,
            CreateTime = model.CreateTime,
            UpdateTime = model.UpdateTime
        });
    }

    /// <summary>
    /// 测试AI模型
    /// </summary>
    [HttpPost("{id}/test")]
    public async Task<Result<string>> TestAiModel(long id)
    {
        try
        {
            var model = await _db.Queryable<AiModel>()
                .Where(it => it.Id == id)
                .FirstAsync();

            if (model == null)
            {
                return Result<string>.Fail("模型不存在");
            }

            // 根据模型类型调用不同的 API
            var testPrompt = "你好，请用一句话介绍你自己";
            string response;

            switch (model.Type.ToLower())
            {
                case "openai":
                    response = await TestOpenAI(model, testPrompt);
                    break;
                case "gemini":
                    response = await TestGemini(model, testPrompt);
                    break;
                default:
                    return Result<string>.Fail($"暂不支持 {model.Type} 类型的模型测试");
            }

            return Result<string>.Ok(response);
        }
        catch (Exception ex)
        {
            return Result<string>.Fail($"测试失败: {ex.Message}");
        }
    }

    private async Task<string> TestOpenAI(AiModel model, string prompt)
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {model.ApiKey}");

        var requestBody = new
        {
            model = model.Model,
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            max_tokens = 100
        };

        // 确保 URL 包含 /chat/completions 端点
        var apiUrl = model.ApiUrl.TrimEnd('/');
        if (!apiUrl.EndsWith("/chat/completions"))
        {
            apiUrl += "/chat/completions";
        }

        var response = await client.PostAsJsonAsync(apiUrl, requestBody);
        response.EnsureSuccessStatusCode();

        var jsonString = await response.Content.ReadAsStringAsync();
        var jsonDoc = System.Text.Json.JsonDocument.Parse(jsonString);

        if (jsonDoc.RootElement.TryGetProperty("choices", out var choices) &&
            choices.GetArrayLength() > 0)
        {
            var firstChoice = choices[0];
            if (firstChoice.TryGetProperty("message", out var message) &&
                message.TryGetProperty("content", out var content))
            {
                return content.GetString() ?? "无响应";
            }
        }

        return "无响应";
    }

    private async Task<string> TestGemini(AiModel model, string prompt)
    {
        using var client = new HttpClient();

        var url = $"{model.ApiUrl}?key={model.ApiKey}";
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[] { new { text = prompt } }
                }
            }
        };

        var response = await client.PostAsJsonAsync(url, requestBody);
        response.EnsureSuccessStatusCode();

        var jsonString = await response.Content.ReadAsStringAsync();
        var jsonDoc = System.Text.Json.JsonDocument.Parse(jsonString);

        if (jsonDoc.RootElement.TryGetProperty("candidates", out var candidates) &&
            candidates.GetArrayLength() > 0)
        {
            var firstCandidate = candidates[0];
            if (firstCandidate.TryGetProperty("content", out var content) &&
                content.TryGetProperty("parts", out var parts) &&
                parts.GetArrayLength() > 0)
            {
                var firstPart = parts[0];
                if (firstPart.TryGetProperty("text", out var text))
                {
                    return text.GetString() ?? "无响应";
                }
            }
        }

        return "无响应";
    }

    /// <summary>
    /// 创建AI模型
    /// </summary>
    [HttpPost]
    public async Task<Result<AiModelDto>> CreateAiModel([FromBody] CreateAiModelRequest request)
    {
        try
        {
            // 如果设置为默认，先取消其他默认
            if (request.IsDefault)
            {
                await _db.Updateable<AiModel>()
                    .SetColumns(it => it.IsDefault == false)
                    .Where(it => it.IsDefault)
                    .ExecuteCommandAsync();
            }

            var model = new AiModel
            {
                Name = request.Name,
                Type = request.Type,
                ApiKey = request.ApiKey,
                ApiUrl = request.ApiUrl,
                Model = request.Model,
                IsDefault = request.IsDefault,
                IsEnabled = request.IsEnabled,
                Remark = request.Remark,
                CreateTime = DateTime.Now,
                UpdateTime = DateTime.Now
            };

            await _db.Insertable(model).ExecuteCommandAsync();

            return Result<AiModelDto>.Ok(new AiModelDto
            {
                Id = model.Id,
                Name = model.Name,
                Type = model.Type,
                ApiKey = model.ApiKey,
                ApiUrl = model.ApiUrl,
                Model = model.Model,
                IsDefault = model.IsDefault,
                IsEnabled = model.IsEnabled,
                Remark = model.Remark,
                CreateTime = model.CreateTime,
                UpdateTime = model.UpdateTime
            });
        }
        catch (Exception ex)
        {
            return Result<AiModelDto>.Fail(ex.Message);
        }
    }

    /// <summary>
    /// 更新AI模型
    /// </summary>
    [HttpPut]
    public async Task<Result<AiModelDto>> UpdateAiModel([FromBody] UpdateAiModelRequest request)
    {
        try
        {
            var model = await _db.Queryable<AiModel>()
                .Where(it => it.Id == request.Id)
                .FirstAsync();

            if (model == null)
            {
                return Result<AiModelDto>.Fail("模型不存在");
            }

            // 如果设置为默认，先取消其他默认
            if (request.IsDefault && !model.IsDefault)
            {
                await _db.Updateable<AiModel>()
                    .SetColumns(it => it.IsDefault == false)
                    .Where(it => it.IsDefault)
                    .ExecuteCommandAsync();
            }

            model.Name = request.Name;
            model.Type = request.Type;
            model.ApiKey = request.ApiKey;
            model.ApiUrl = request.ApiUrl;
            model.Model = request.Model;
            model.IsDefault = request.IsDefault;
            model.IsEnabled = request.IsEnabled;
            model.Remark = request.Remark;
            model.UpdateTime = DateTime.Now;

            await _db.Updateable(model).ExecuteCommandAsync();

            return Result<AiModelDto>.Ok(new AiModelDto
            {
                Id = model.Id,
                Name = model.Name,
                Type = model.Type,
                ApiKey = model.ApiKey,
                ApiUrl = model.ApiUrl,
                Model = model.Model,
                IsDefault = model.IsDefault,
                IsEnabled = model.IsEnabled,
                Remark = model.Remark,
                CreateTime = model.CreateTime,
                UpdateTime = model.UpdateTime
            });
        }
        catch (Exception ex)
        {
            return Result<AiModelDto>.Fail(ex.Message);
        }
    }

    /// <summary>
    /// 删除AI模型
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<Result> DeleteAiModel(long id)
    {
        try
        {
            var model = await _db.Queryable<AiModel>()
                .Where(it => it.Id == id)
                .FirstAsync();

            if (model == null)
            {
                return Result.Fail("模型不存在");
            }

            await _db.Deleteable<AiModel>().Where(it => it.Id == id).ExecuteCommandAsync();

            return Result.Ok();
        }
        catch (Exception ex)
        {
            return Result.Fail(ex.Message);
        }
    }
}
