# 环境准备指南

> 本文档介绍如何搭建疫苗自动分拣控制系统的开发环境。

---

## 1. 环境要求

### 1.1 开发机配置

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 4核 | 8核+ |
| 内存 | 8GB | 16GB+ |
| 硬盘 | 50GB SSD | 100GB+ SSD |
| 操作系统 | Windows 10 | Windows 11 |

### 1.2 软件依赖

| 软件 | 版本 | 用途 | 下载地址 |
|------|------|------|----------|
| Docker Desktop | 最新版 | 容器运行环境 | https://www.docker.com/products/docker-desktop |
| .NET SDK | 8.0+ | C#开发 | https://dotnet.microsoft.com/download |
| Go | 1.21+ | 后端开发 | https://go.dev/dl/ |
| Python | 3.11+ | 视觉服务 | https://www.python.org/downloads/ |
| Node.js | 18+ | 前端开发 | https://nodejs.org/ |
| Visual Studio | 2022 | C# IDE | https://visualstudio.microsoft.com/ |
| VS Code | 最新版 | 通用IDE | https://code.visualstudio.com/ |
| Git | 最新版 | 版本控制 | https://git-scm.com/ |

---

## 2. 快速开始

### 2.1 一键启动 (Docker)

最简单的方式是使用Docker Compose一键启动所有服务：

```powershell
# 进入项目目录
cd C:\Users\Le'novo\.claude\skills\JONSON

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 2.2 服务访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| Web前端 | http://localhost:3000 | 远程监控界面 |
| API网关 | http://localhost:8080 | REST API |
| WebSocket | ws://localhost:8081 | 实时数据推送 |
| PostgreSQL | localhost:5432 | 数据库 |
| Redis | localhost:6379 | 缓存 |
| MinIO | http://localhost:9001 | 对象存储控制台 |

---

## 3. 分步安装

如果需要单独开发某个模块，可以按以下步骤操作：

### 3.1 启动基础服务

```powershell
# 只启动数据库和Redis
docker-compose up -d postgres redis

# 验证数据库
docker exec -it vaccine-postgres psql -U postgres -d vaccine_db -c "\dt"
```

### 3.2 Go 网关服务

```powershell
# 进入目录
cd backend/go-gateway

# 安装依赖
go mod download

# 修改配置 (configs/config.yaml)
# - database.host: localhost
# - redis.addr: localhost:6379

# 启动服务
go run cmd/server/main.go
```

### 3.3 Python 视觉服务

```powershell
# 进入目录
cd backend/python-vision

# 创建虚拟环境
python -m venv venv
.\venv\Scripts\Activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

### 3.4 Web 前端

```powershell
# 进入目录
cd frontend/vaccine-monitor

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 3.5 C# 主控程序

1. 使用 Visual Studio 2022 打开 `desktop/VaccineControlSystem/VaccineControlSystem.sln`
2. 还原 NuGet 包
3. 修改 `appsettings.json` 中的PLC地址
4. 按 F5 启动调试

---

## 4. 数据库初始化

### 4.1 自动初始化 (Docker)

使用Docker启动时，数据库会自动执行 `database/schema/init.sql`。

### 4.2 手动初始化

```powershell
# 连接数据库
psql -h localhost -U postgres -d vaccine_db

# 执行初始化脚本
\i database/schema/init.sql

# 验证表
\dt
```

### 4.3 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 超级管理员 |

---

## 5. 开发工具配置

### 5.1 VS Code 插件推荐

```json
{
  "recommendations": [
    "golang.go",
    "ms-python.python",
    "ms-dotnettools.csharp",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker"
  ]
}
```

### 5.2 Git 配置

```bash
# 配置用户信息
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 配置换行符 (Windows)
git config --global core.autocrlf true
```

---

## 6. PLC 模拟器 (开发用)

在没有实际PLC的情况下，可以使用Modbus模拟器进行开发测试：

### 6.1 推荐工具

- **ModRSsim2**: 免费的Modbus从站模拟器
- **Modbus Poll**: Modbus主站测试工具

### 6.2 配置步骤

1. 下载并安装 ModRSsim2
2. 配置为 Modbus TCP 从站，端口 502
3. 修改 C# 程序配置连接到模拟器

---

## 7. 常见问题

### Q1: Docker 启动失败

```
Error: Cannot connect to Docker daemon
```

**解决**: 确保 Docker Desktop 已启动，并在系统托盘可见。

### Q2: 端口被占用

```
Error: port 5432 is already in use
```

**解决**: 
```powershell
# 查找占用端口的进程
netstat -ano | findstr :5432

# 或修改 docker-compose.yml 中的端口映射
```

### Q3: 数据库连接失败

**解决**: 
1. 确认 PostgreSQL 容器运行正常
2. 检查防火墙设置
3. 验证连接字符串

### Q4: Go 依赖下载慢

**解决**: 配置 Go 代理
```powershell
go env -w GOPROXY=https://goproxy.cn,direct
```

### Q5: npm 安装慢

**解决**: 配置淘宝镜像
```powershell
npm config set registry https://registry.npmmirror.com
```

---

## 8. 联系支持

如遇到其他问题，请联系技术支持：

- 邮箱: support@vaccine-ads.com
- 文档: 项目 `/docs` 目录

---

> 更新日期: 2024-12-29

