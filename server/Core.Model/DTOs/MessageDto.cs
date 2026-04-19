namespace Core.Model.DTOs;

public class MessageDto
{
    public long Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? SecretContent { get; set; }
    public string? SecretCode { get; set; }
    public string? AiEcho { get; set; }
    public string AvatarType { get; set; } = "anonymous";
    public string AvatarId { get; set; } = "1";
    public string? AvatarUrl { get; set; }
    public DateTime? CreateTime { get; set; }
    public string? IpAddress { get; set; }
    public string? IpLocation { get; set; }
    public string? DeviceType { get; set; }
    public string? Browser { get; set; }
    public bool IsUnlocked { get; set; }
    public List<ReplyDto> Replies { get; set; } = new();
    public int ReportCount { get; set; }
    public int ResonanceCount { get; set; }
    public string? Email { get; set; }
}

public class ReplyDto
{
    public string Content { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
}

public class CreateMessageRequest
{
    public string Content { get; set; } = string.Empty;
    public string SecretCode { get; set; } = string.Empty;
    public string? SecretContent { get; set; }
    public string AvatarType { get; set; } = "anonymous";
    public string AvatarId { get; set; } = "1";
    public string? AvatarUrl { get; set; }
    public string? IpAddress { get; set; }
    public string? IpLocation { get; set; }
    public string? DeviceType { get; set; }
    public string? Browser { get; set; }
    public string? Email { get; set; }
}

public class QueryMessageRequest
{
    public string SecretCode { get; set; } = string.Empty;
}

public class MessageListResultDto
{
    public int Total { get; set; }
    public List<MessageDto> Messages { get; set; } = new();
}

public class UpdateMessageRequest
{
    public string Content { get; set; } = string.Empty;
}

public class AnalyzeMoodRequest
{
    public string Context { get; set; } = string.Empty;
}

public class AddReplyRequest
{
    public string Content { get; set; } = string.Empty;
}
