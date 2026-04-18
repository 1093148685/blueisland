using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using SqlSugar;
using Core.Model.Entities;

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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
