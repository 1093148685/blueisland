using System.Collections.Concurrent;

namespace BlueIsland.Api;

/// <summary>
/// 全局 IP 封禁服务接口
/// </summary>
public interface IGlobalBlockedIpService
{
    bool IsBlocked(string ip);
    void AddIp(string ip, string reason);
    void RemoveIp(string ip);
    IEnumerable<(string ip, string reason, DateTime expireTime)> GetBlockedIps();
}

/// <summary>
/// 全局 IP 封禁服务实现
/// </summary>
public class GlobalBlockedIpService : IGlobalBlockedIpService
{
    private readonly ConcurrentDictionary<string, (string reason, DateTime expireTime)> _blockedIps = new();

    public bool IsBlocked(string ip)
    {
        if (_blockedIps.TryGetValue(ip, out var info))
        {
            if (info.expireTime > DateTime.Now)
                return true;
            _blockedIps.TryRemove(ip, out _);
        }
        return false;
    }

    public void AddIp(string ip, string reason)
    {
        _blockedIps[ip] = (reason, DateTime.Now.AddDays(365)); // 手动封禁默认1年
    }

    public void RemoveIp(string ip)
    {
        _blockedIps.TryRemove(ip, out _);
    }

    public IEnumerable<(string ip, string reason, DateTime expireTime)> GetBlockedIps()
    {
        var now = DateTime.Now;
        var result = new List<(string, string, DateTime)>();
        foreach (var kvp in _blockedIps)
        {
            if (kvp.Value.expireTime > now)
                result.Add((kvp.Key, kvp.Value.reason, kvp.Value.expireTime));
            else
                _blockedIps.TryRemove(kvp.Key, out _);
        }
        return result;
    }
}
