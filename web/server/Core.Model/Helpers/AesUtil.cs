using System.Security.Cryptography;
using System.Text;

namespace Core.Model.Helpers;

public static class AesUtil
{
    private static readonly byte[] DefaultKey = Encoding.UTF8.GetBytes("BlueIsland2024Key!".PadRight(32, '!'));
    private static readonly byte[] DefaultIV = Encoding.UTF8.GetBytes("BlueIslandIV16!".PadRight(16, '!'));

    public static string Encrypt(string plainText, string key)
    {
        if (string.IsNullOrEmpty(plainText))
            return string.Empty;

        var keyBytes = DeriveKeyBytes(key);
        var ivBytes = DeriveIVBytes(key);

        using var aes = Aes.Create();
        aes.Key = keyBytes;
        aes.IV = ivBytes;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var encryptedBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        return Convert.ToBase64String(encryptedBytes);
    }

    public static string Decrypt(string cipherText, string key)
    {
        if (string.IsNullOrEmpty(cipherText))
            return string.Empty;

        try
        {
            var keyBytes = DeriveKeyBytes(key);
            var ivBytes = DeriveIVBytes(key);

            using var aes = Aes.Create();
            aes.Key = keyBytes;
            aes.IV = ivBytes;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor();
            var cipherBytes = Convert.FromBase64String(cipherText);
            var decryptedBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);

            return Encoding.UTF8.GetString(decryptedBytes);
        }
        catch
        {
            return string.Empty;
        }
    }

    public static string HashSha256(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static byte[] DeriveKeyBytes(string key)
    {
        if (string.IsNullOrEmpty(key))
            return DefaultKey;

        using var sha256 = SHA256.Create();
        return sha256.ComputeHash(Encoding.UTF8.GetBytes(key));
    }

    public static string DeriveKey(string password)
    {
        return HashSha256(password);
    }

    private static byte[] DeriveIVBytes(string key)
    {
        if (string.IsNullOrEmpty(key))
            return DefaultIV;

        using var md5 = MD5.Create();
        return md5.ComputeHash(Encoding.UTF8.GetBytes(key));
    }
}
