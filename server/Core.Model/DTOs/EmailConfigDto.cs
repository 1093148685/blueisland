namespace Core.Model.DTOs;

public class EmailConfigDto
{
    public long Id { get; set; } = 1;
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string? FromEmail { get; set; }
    public string? FromName { get; set; }
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }
    public bool Enabled { get; set; } = false;
    public string? Remark { get; set; }
}
