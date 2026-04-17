namespace Core.Common.Result;

public class Result<T>
{
    public int Code { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }

    public static Result<T> Ok(T data, string? message = null)
    {
        return new Result<T>
        {
            Code = 200,
            Data = data,
            Message = message
        };
    }

    public static Result<T> Fail(string message)
    {
        return new Result<T>
        {
            Code = 500,
            Message = message,
            Data = default
        };
    }
}

public class Result
{
    public int Code { get; set; }
    public string? Message { get; set; }

    public static Result Ok(string? message = null)
    {
        return new Result
        {
            Code = 200,
            Message = message
        };
    }

    public static Result Fail(string message)
    {
        return new Result
        {
            Code = 500,
            Message = message
        };
    }
}
