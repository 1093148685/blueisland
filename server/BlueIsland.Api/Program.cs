using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text.Json;
using SqlSugar;
using Core.Model.Entities;
using BlueIsland.Api;

var builder = WebApplication.CreateBuilder(args);

var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost;Port=3306;Database=blueisland;User=root;Password=123456;";

var jwtSecretKey = "BlueIsland.SecretKey.2024.Guestbook";

builder.Services.AddScoped<ISqlSugarClient>(s =>
{
    var db = new SqlSugarClient(new ConnectionConfig()
    {
        ConnectionString = connectionString,
        DbType = DbType.MySql,
        IsAutoCloseConnection = true,
        InitKeyType = InitKeyType.Attribute,
        MoreSettings = new ConnMoreSettings()
        {
            IsAutoRemoveDataCache = true
        }
    });

    // 初始化数据库表
    try
    {
        db.CodeFirst.InitTables<Message>();
        db.CodeFirst.InitTables<SysUser>();
        db.CodeFirst.InitTables<AiModel>();
        db.CodeFirst.InitTables<AiConfig>();
        db.CodeFirst.InitTables<AuditLog>();
        db.CodeFirst.InitTables<MusicConfig>();
        db.CodeFirst.InitTables<MusicLog>();
        db.CodeFirst.InitTables<AccessLog>();
        db.CodeFirst.InitTables<SecuritySettings>();
        db.CodeFirst.InitTables<SecurityLog>();
    }
    catch { }

    return db;
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// 注册全局IP封禁服务
builder.Services.AddSingleton<IGlobalBlockedIpService, GlobalBlockedIpService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 音乐文件服务 - 容器环境下使用固定路径
var musicPath = Path.GetFullPath(Path.Combine(
    Directory.Exists("/app") ? "/app" : builder.Environment.ContentRootPath,
    "assets", "music"
));
Console.WriteLine($"[DEBUG] Music path: {musicPath}, exists: {Directory.Exists(musicPath)}");

// 白噪音文件服务
var ambientPath = Path.GetFullPath(Path.Combine(
    Directory.Exists("/app") ? "/app" : builder.Environment.ContentRootPath,
    "assets", "ambient"
));
app.MapGet("/assets/ambient/{file}", async (string file, HttpContext context) =>
{
    var filePath = Path.Combine(ambientPath, file);
    if (File.Exists(filePath))
    {
        var ext = Path.GetExtension(file).ToLower();
        var contentType = ext == ".mp3" ? "audio/mpeg" : ext == ".wav" ? "audio/wav" : "application/octet-stream";
        return Results.File(filePath, contentType);
    }
    return Results.NotFound();
});

app.MapGet("/assets/ambient", async (HttpContext context) =>
{
    if (Directory.Exists(ambientPath))
    {
        var files = Directory.GetFiles(ambientPath)
            .Select(f => Path.GetFileName(f))
            .ToList();
        return Results.Ok(files);
    }
    return Results.Ok(new List<string>());
});
app.MapGet("/assets/music/{file}", async (string file, HttpContext context) =>
{
    var filePath = Path.Combine(musicPath, file);
    if (File.Exists(filePath))
    {
        var contentType = file.EndsWith(".mp3") ? "audio/mpeg" : "application/octet-stream";
        return Results.File(filePath, contentType);
    }
    return Results.NotFound();
});

app.MapGet("/assets/music", async (HttpContext context) =>
{
    if (Directory.Exists(musicPath))
    {
        var files = Directory.GetFiles(musicPath, "*.mp3")
            .Select(f => Path.GetFileName(f))
            .ToList();
        return Results.Ok(files);
    }
    return Results.Ok(new List<string>());
});

app.UseCors("AllowAll");

// ============ 安全中间件配置 ============
var allowedRefererDomains = Environment.GetEnvironmentVariable("ALLOWED_REFERER_DOMAINS")
    ?? builder.Configuration["AllowedRefererDomains"]
    ?? "localhost,localhost:5174,localhost:3000,blueisland.xuancangmenpro.online";
var allowedDomainsList = allowedRefererDomains.Split(',').Select(d => d.Trim()).ToList();

var apiSignatureKey = Environment.GetEnvironmentVariable("API_SIGNATURE_KEY")
    ?? builder.Configuration["ApiSignatureKey"]
    ?? "BlueIsland.Secret.Key.2024.Security";

// 静态IP黑名单（环境变量）
var staticBlockedIps = (Environment.GetEnvironmentVariable("BLOCKED_IPS") ?? "").Split(',')
    .Select(ip => ip.Trim()).Where(ip => !string.IsNullOrEmpty(ip)).ToHashSet();

// 签名时间戳有效期（分钟）
var signatureExpireMinutes = 5;

// 频率限制：IP -> (时间戳, 请求计数, 违规次数)
var rateLimitDict = new ConcurrentDictionary<string, (long timestamp, int count, int violations)>();

// 敏感操作路径（用于日志记录）
var sensitivePaths = new[] { "/api/messages", "/api/ai-models", "/api/music-config", "/api/email-config", "/api/access", "/api/user" };

// 安全设置缓存
var securitySettingsCache = new
{
    MaxRequestsPerMinute = 100,
    ViolationThreshold = 3,
    BanDurationMinutes = 5,
    EnableSignatureCheck = true,
    EnableRefererCheck = false,
    EnableIpBlockList = true
};
var securitySettingsLock = new object();

// 异步加载安全设置到缓存
void LoadSecuritySettingsToCache(ISqlSugarClient db)
{
    try
    {
        var settings = db.Queryable<SecuritySettings>().First();
        if (settings != null)
        {
            lock (securitySettingsLock)
            {
                securitySettingsCache = new
                {
                    settings.MaxRequestsPerMinute,
                    settings.ViolationThreshold,
                    settings.BanDurationMinutes,
                    settings.EnableSignatureCheck,
                    settings.EnableRefererCheck,
                    settings.EnableIpBlockList
                };
            }
            Console.WriteLine($"[INFO] Security settings loaded: {settings.MaxRequestsPerMinute} req/min, threshold: {settings.ViolationThreshold}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] Failed to load security settings: {ex.Message}");
    }
}

// 记录安全日志（仅控制台，不在中间件中写数据库）
void LogSecurityEvent(string eventType, string ip, string path, string? details)
{
    Console.WriteLine($"[SECURITY] {eventType} from {ip} at {path}: {details}");
}

Console.WriteLine($"[INFO] Security config loaded - Allowed domains: {string.Join(",", allowedDomainsList)}");
Console.WriteLine($"[INFO] Static blocked IPs: {string.Join(",", staticBlockedIps)}");
Console.WriteLine($"[INFO] Signature key: {apiSignatureKey.Substring(0, Math.Min(5, apiSignatureKey.Length))}***");

// 安全设置懒加载标记
var securitySettingsLoaded = false;
var securitySettingsLoadLock = new object();

// 尝试加载安全设置（如果在中间件中被调用）
void TryLoadSecuritySettings(ISqlSugarClient db)
{
    if (!securitySettingsLoaded)
    {
        lock (securitySettingsLoadLock)
        {
            if (!securitySettingsLoaded)
            {
                LoadSecuritySettingsToCache(db);
                securitySettingsLoaded = true;
            }
        }
    }
}

app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "";
    var method = context.Request.Method;

    // 只对 API 请求应用安全检查
    if (path.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        // 使用缓存的安全设置
        var settings = securitySettingsCache;

        // 获取全局IP封禁服务
        var blockedIpService = context.RequestServices.GetService<IGlobalBlockedIpService>();
        var db = context.RequestServices.GetService<ISqlSugarClient>();

        // 懒加载安全设置
        if (db != null)
            TryLoadSecuritySettings(db);

        // ========== 0. IP 黑名单检查 ==========
        if (staticBlockedIps.Contains(ip) || (blockedIpService != null && blockedIpService.IsBlocked(ip)))
        {
            Console.WriteLine($"[WARN] Blocked IP access: {ip} - {path}");
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { code = 403, message = "访问被拒绝" });
            return;
        }

        // ========== 1. 频率限制 & 违规追踪 ==========
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var violationWindowMs = 60000L * settings.BanDurationMinutes; // 违规窗口

        var rateInfo = rateLimitDict.AddOrUpdate(ip,
            (_) => (now, 1, 0),
            (_, old) =>
            {
                // 如果超过封禁窗口，清零违规次数
                if (now - old.timestamp > violationWindowMs)
                    return (now, 1, 0);
                // 如果超过频率限制窗口，重置计数但不重置违规
                if (now - old.timestamp > 60000)
                    return (now, 1, old.violations);
                return (old.timestamp, old.count + 1, old.violations);
            });

        var rateLimitWindowMs = 60000;
        var maxRequests = settings.MaxRequestsPerMinute;

        if (now - rateInfo.timestamp <= rateLimitWindowMs && rateInfo.count > maxRequests)
        {
            // 增加违规次数
            var newViolations = rateInfo.violations + 1;
            rateLimitDict[ip] = (rateInfo.timestamp, rateInfo.count, newViolations);

            Console.WriteLine($"[WARN] Rate limit exceeded: {ip} - {path}, violations: {newViolations}/{settings.ViolationThreshold}");

            // 记录安全日志
            if (db != null)
                LogSecurityEvent("RATE_LIMIT", ip, path, $"超出频率限制 {rateInfo.count}/{maxRequests}，违规次数: {newViolations}");

            // 检查是否达到封禁阈值
            if (newViolations >= settings.ViolationThreshold && blockedIpService != null)
            {
                blockedIpService.AddIp(ip, $"频率限制违规次数超过阈值 ({newViolations}次)");
                Console.WriteLine($"[WARN] IP {ip} 已被临时封禁 {settings.BanDurationMinutes} 分钟");
                rateLimitDict[ip] = (now, 0, 0); // 重置

                if (db != null)
                    LogSecurityEvent("IP_BLOCKED", ip, path, $"因频率限制违规被临时封禁 {settings.BanDurationMinutes} 分钟");

                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { code = 403, message = "IP已被临时封禁，请稍后再试" });
                return;
            }

            context.Response.StatusCode = 429;
            await context.Response.WriteAsJsonAsync(new { code = 429, message = "请求过于频繁，请稍后再试" });
            return;
        }

        // ========== 2. Referer 检查 ==========
        if (settings.EnableRefererCheck)
        {
            var referer = context.Request.Headers.Referer.FirstOrDefault();
            if (!string.IsNullOrEmpty(referer))
            {
                try
                {
                    var refererUri = new Uri(referer);
                    var refererHost = refererUri.Host.ToLower();
                    var isAllowed = allowedDomainsList.Any(domain =>
                        refererHost.Equals(domain, StringComparison.OrdinalIgnoreCase) ||
                        refererHost.EndsWith("." + domain, StringComparison.OrdinalIgnoreCase));

                    if (!isAllowed)
                    {
                        Console.WriteLine($"[WARN] Referer domain not allowed: {refererHost} from {ip}");
                        if (db != null)
                            LogSecurityEvent("REFERRER_BLOCK", ip, path, $"Referer域名不允许: {refererHost}");

                        context.Response.StatusCode = 403;
                        await context.Response.WriteAsJsonAsync(new { code = 403, message = "Referer来源不被允许" });
                        return;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WARN] Referer parse error: {ex.Message}");
                }
            }
        }

        // ========== 3. 签名时间戳校验（仅 POST/PUT/DELETE） ==========
        if (settings.EnableSignatureCheck && (method == "POST" || method == "PUT" || method == "DELETE"))
        {
            var timestamp = context.Request.Headers["X-Timestamp"].FirstOrDefault();
            var signature = context.Request.Headers["X-Signature"].FirstOrDefault();

            if (string.IsNullOrEmpty(timestamp) || string.IsNullOrEmpty(signature))
            {
                Console.WriteLine($"[WARN] Missing signature headers from {ip} - {path}");
                if (db != null)
                    LogSecurityEvent("SIGNATURE_FAIL", ip, path, "缺少签名头");
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { code = 403, message = "缺少签名参数" });
                return;
            }

            if (long.TryParse(timestamp, out var ts))
            {
                var requestTime = DateTimeOffset.FromUnixTimeMilliseconds(ts);
                var diff = Math.Abs((DateTimeOffset.UtcNow - requestTime).TotalMinutes);
                if (diff > signatureExpireMinutes)
                {
                    Console.WriteLine($"[WARN] Signature expired from {ip}: diff={diff} minutes");
                    if (db != null)
                        LogSecurityEvent("SIGNATURE_FAIL", ip, path, $"签名过期: diff={diff}分钟");
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsJsonAsync(new { code = 403, message = "请求已过期" });
                    return;
                }
            }

            var dataToSign = $"{path}:{timestamp}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(apiSignatureKey));
            var expectedSig = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(dataToSign)));
            if (signature != expectedSig)
            {
                Console.WriteLine($"[WARN] Signature mismatch from {ip}");
                if (db != null)
                    LogSecurityEvent("SIGNATURE_FAIL", ip, path, "签名不匹配");
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { code = 403, message = "签名验证失败" });
                return;
            }
        }

        // ========== 4. 敏感操作日志记录 ==========
        if (sensitivePaths.Any(sp => path.StartsWith(sp, StringComparison.OrdinalIgnoreCase)))
        {
            var logMethod = method switch
            {
                "POST" => "CREATE",
                "PUT" => "UPDATE",
                "DELETE" => "DELETE",
                _ => method
            };
            Console.WriteLine($"[OPLOG] {logMethod} {path} from {ip} at {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        }
    }

    await next();
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
