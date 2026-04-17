using System.Net;
using System.Text.RegularExpressions;

namespace Core.Common.Helpers;

public static class IpHelper
{
    public static string GetRealIpAddress(string? forwardedFor, string? realIp, IPAddress? remoteIpAddress)
    {
        // 优先从代理头获取真实 IP
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        return remoteIpAddress?.ToString() ?? "127.0.0.1";
    }

    public static (string deviceType, string browser, string os) ParseUserAgent(string userAgent)
    {
        if (string.IsNullOrEmpty(userAgent))
            return ("未知", "未知", "未知");

        var deviceType = "桌面端";
        var browser = "未知浏览器";
        var os = "未知系统";

        // 检测设备类型
        if (Regex.IsMatch(userAgent, @"Mobile|Android|iPhone|iPad", RegexOptions.IgnoreCase))
        {
            deviceType = "移动端";
            if (Regex.IsMatch(userAgent, @"iPad", RegexOptions.IgnoreCase))
                deviceType = "平板";
        }

        // 检测浏览器
        if (Regex.IsMatch(userAgent, @"MicroMessenger", RegexOptions.IgnoreCase))
            browser = "微信";
        else if (Regex.IsMatch(userAgent, @"QQ/", RegexOptions.IgnoreCase))
            browser = "QQ浏览器";
        else if (Regex.IsMatch(userAgent, @"Chrome/", RegexOptions.IgnoreCase))
            browser = "Chrome";
        else if (Regex.IsMatch(userAgent, @"Firefox/", RegexOptions.IgnoreCase))
            browser = "Firefox";
        else if (Regex.IsMatch(userAgent, @"Safari/", RegexOptions.IgnoreCase))
            browser = "Safari";
        else if (Regex.IsMatch(userAgent, @"Edge/", RegexOptions.IgnoreCase))
            browser = "Edge";

        // 检测操作系统
        if (Regex.IsMatch(userAgent, @"Windows NT 10", RegexOptions.IgnoreCase))
            os = "Windows 10/11";
        else if (Regex.IsMatch(userAgent, @"Windows NT 6.3", RegexOptions.IgnoreCase))
            os = "Windows 8.1";
        else if (Regex.IsMatch(userAgent, @"Mac OS X", RegexOptions.IgnoreCase))
            os = "macOS";
        else if (Regex.IsMatch(userAgent, @"iPhone", RegexOptions.IgnoreCase))
            os = "iOS";
        else if (Regex.IsMatch(userAgent, @"Android", RegexOptions.IgnoreCase))
            os = "Android";
        else if (Regex.IsMatch(userAgent, @"Linux", RegexOptions.IgnoreCase))
            os = "Linux";

        return (deviceType, browser, os);
    }

    public static string GetIpLocation(string ipAddress)
    {
        if (ipAddress == "127.0.0.1" || ipAddress == "::1")
            return "本地";

        return "未知";
    }
}
