FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
EXPOSE 5170

# 复制发布的应用
COPY BlueIsland.Api/bin/Release/net9.0/publish/ /app/

# 复制资源文件
COPY assets/ /app/assets/

# 设置资源路径环境变量
ENV ASSETS_MUSIC_PATH=/app/assets/music
ENV ASSETS_AMBIENT_PATH=/app/assets/ambient

ENTRYPOINT ["dotnet", "BlueIsland.Api.dll"]
