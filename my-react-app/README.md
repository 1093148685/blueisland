# BlueIsland 留言板项目

一个基于 React + .NET 的现代化留言板应用，支持匿名留言、暗号查询、AI 模型管理等功能。

## 项目结构

```
├── src/                          # 前端源码
│   ├── api.js                   # API 服务层
│   ├── App.jsx                  # 主应用路由
│   ├── main.jsx                 # 应用入口
│   └── pages/                   # 页面组件
│       ├── HomePage.jsx         # 留言板主页
│       ├── LoginPage.jsx        # 登录页面
│       └── AdminPage.jsx        # 后台管理页面
├── server/                       # 后端源码 (C#/.NET)
│   ├── BlueIsland.Api/          # API 项目
│   │   ├── Controllers/         # 控制器
│   │   │   ├── MessageController.cs    # 留言管理
│   │   │   ├── AuthController.cs       # 认证管理
│   │   │   └── AiModelController.cs    # AI模型管理
│   │   └── Program.cs           # 启动配置
│   ├── Core.Model/              # 数据模型
│   │   ├── Entities/            # 实体类
│   │   └── DTOs/                # 数据传输对象
│   └── Core.Common/             # 公共类库
│       ├── Extensions/          # 扩展方法
│       └── Helpers/             # 辅助类
└── package.json                 # 前端依赖配置
```

## 功能特性

### 前台功能
- 📝 发送留言（支持匿名头像和 QQ 头像）
- 🔐 暗号系统（可设置暗号查询特定留言）
- 🎵 音乐播放器
- 📱 响应式设计

### 后台功能
- 🔑 JWT 认证登录
- 📋 留言管理（查看、编辑、删除）
- 🤖 AI 模型配置（支持 OpenAI、Claude、Gemini 等）
- 👤 用户管理

## 技术栈

### 前端
- React 19
- React Router DOM
- Axios
- Tailwind CSS
- Lucide React (图标)

### 后端
- .NET 9
- SqlSugar (ORM)
- JWT 认证
- BCrypt 密码加密
- MySQL 数据库

## 快速开始

### 前端启动

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

### 后端启动

1. 配置数据库连接字符串（在 `server/BlueIsland.Api/appsettings.json`）：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=blueisland;User=root;Password=your_password;"
  }
}
```

2. 启动后端：

```bash
cd server/BlueIsland.Api
dotnet run
```

后端默认运行在 `http://localhost:5000`

### 初始化管理员

首次使用需要初始化管理员账户：

1. 访问 `http://localhost:5173/login`
2. 点击"首次使用？初始化管理员"
3. 输入用户名和密码创建管理员账户

## API 接口

### 认证相关
- `POST /api/login` - 登录
- `POST /api/init-admin` - 初始化管理员
- `GET /api/user/info` - 获取当前用户信息
- `POST /api/password/update` - 修改密码

### 留言相关
- `GET /api/messages` - 获取所有留言
- `GET /api/messages/{secretCode}` - 根据暗号查询留言
- `POST /api/messages` - 发布留言
- `POST /api/messages/unlock` - 解锁私密内容
- `GET /api/messages/admin` - 管理员获取所有留言
- `DELETE /api/messages/admin/{id}` - 删除留言
- `PUT /api/messages/admin/{id}` - 更新留言

### AI 模型相关
- `GET /api/ai-models` - 获取所有 AI 模型
- `GET /api/ai-models/default` - 获取默认 AI 模型
- `POST /api/ai-models` - 创建 AI 模型
- `PUT /api/ai-models` - 更新 AI 模型
- `DELETE /api/ai-models/{id}` - 删除 AI 模型

## 配置说明

### 前端 API 地址配置

修改 `src/api.js` 中的 `API_BASE_URL`：

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### 后端 JWT 密钥配置

修改 `server/BlueIsland.Api/Program.cs` 中的 `jwtSecretKey`（生产环境建议使用环境变量）。

## 数据库表结构

### t_message (留言表)
- Id - 主键
- Content - 留言内容
- SecretCode - 暗号（哈希存储）
- SecretContent - 加密的私密内容
- AvatarType - 头像类型
- AvatarId - 头像ID
- AvatarUrl - 头像URL
- CreateTime - 创建时间
- IpAddress - IP地址
- IpLocation - IP属地
- DeviceType - 设备类型
- Browser - 浏览器
- IsDeleted - 删除标志

### t_sys_user (用户表)
- Id - 主键
- Username - 用户名
- Password - 密码（BCrypt加密）
- Role - 角色
- CreateTime - 创建时间
- UpdateTime - 更新时间
- IsDeleted - 删除标志

### t_ai_model (AI模型表)
- Id - 主键
- Name - 模型名称
- Type - 模型类型
- ApiKey - API密钥
- ApiUrl - API地址
- Model - 模型名称
- IsDefault - 是否默认
- IsEnabled - 是否启用
- Remark - 备注
- CreateTime - 创建时间
- UpdateTime - 更新时间

## 开发说明

- 前端使用 Vite 作为构建工具
- 后端使用 SqlSugar 的 CodeFirst 模式自动创建数据库表
- 密码使用 BCrypt 加密存储
- 暗号使用 SHA256 哈希存储
- 私密内容使用 AES 加密存储

## 许可证

MIT
