# ============================================
# 疫苗分拣系统 - 一键启动全部服务 (Docker)
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 疫苗自动分拣控制系统 - 全服务启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 项目根目录
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $ProjectRoot

# 检查Docker
Write-Host "[检查] Docker环境..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $?) {
    Write-Host "错误: Docker未运行，请先启动Docker Desktop" -ForegroundColor Red
    exit 1
}
Write-Host "Docker环境正常" -ForegroundColor Green

# 构建并启动所有服务
Write-Host ""
Write-Host "[启动] 构建并启动所有服务..." -ForegroundColor Yellow
docker-compose up -d --build

# 等待服务就绪
Write-Host ""
Write-Host "[等待] 服务启动中..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 检查服务状态
Write-Host ""
Write-Host "[状态] 服务运行状态:" -ForegroundColor Yellow
docker-compose ps

# 显示访问地址
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " 服务已启动! 访问地址:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Web前端:        http://localhost:3000" -ForegroundColor White
Write-Host "API接口:        http://localhost:8080/api/v1" -ForegroundColor White
Write-Host "WebSocket:      ws://localhost:8081/ws" -ForegroundColor White
Write-Host "gRPC服务:       localhost:9090" -ForegroundColor White
Write-Host "视觉服务gRPC:   localhost:5001" -ForegroundColor White
Write-Host ""
Write-Host "MinIO控制台:    http://localhost:9001" -ForegroundColor Gray
Write-Host "  用户名: minioadmin / 密码: minioadmin123" -ForegroundColor Gray
Write-Host ""
Write-Host "数据库连接:" -ForegroundColor Gray
Write-Host "  PostgreSQL: localhost:5432/vaccine_db" -ForegroundColor Gray
Write-Host "  Redis:      localhost:6379" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green

Write-Host ""
Write-Host "提示: 使用 'docker-compose logs -f' 查看日志" -ForegroundColor Yellow
Write-Host "提示: 使用 'docker-compose down' 停止服务" -ForegroundColor Yellow
Write-Host ""

