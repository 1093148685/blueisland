namespace Core.Model.DTOs;

public class MusicConfigDto
{
    public long Id { get; set; } = 1;
    public string DefaultPlaybackMode { get; set; } = "loop";
    public int DefaultVolume { get; set; } = 70;
    public bool Enabled { get; set; } = true;
    public bool AmbientEnabled { get; set; } = true;
    public int AmbientVolume { get; set; } = 50;
    public string? AmbientWavesUrl { get; set; }
    public string? AmbientRainUrl { get; set; }
    public string? AmbientFireUrl { get; set; }
    public string? Remark { get; set; }
}

public class MusicStatsDto
{
    public long TotalSearches { get; set; }
    public long TotalPlays { get; set; }
    public long TotalErrors { get; set; }
    public long TodaySearches { get; set; }
    public long TodayPlays { get; set; }
    public List<MusicLogDto> RecentLogs { get; set; } = new();
}

public class MusicLogDto
{
    public long Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? SongName { get; set; }
    public string? SongId { get; set; }
    public string? Source { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreateTime { get; set; }
}

public class MusicLogRequest
{
    public string Action { get; set; } = string.Empty;
    public string? SongName { get; set; }
    public string? SongId { get; set; }
    public string? Source { get; set; }
    public string Status { get; set; } = "success";
    public string? ErrorMessage { get; set; }
}

public class AccessStatsDto
{
    public long TotalVisits { get; set; }
    public long TodayVisits { get; set; }
    public long OnlineUsers { get; set; }
    public long UniqueIps { get; set; }
    public List<OnlineUserDto> RecentUsers { get; set; } = new();
    public Dictionary<string, long> PageOnlineUsers { get; set; } = new();
}

public class OnlineUserDto
{
    public string IpAddress { get; set; } = string.Empty;
    public DateTime LastSeen { get; set; }
}
