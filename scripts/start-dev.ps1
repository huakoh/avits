# ============================================
# 疫苗分拣系统 - 开发环境启动脚本 (Windows)
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 疫苗自动分拣控制系统 - 开发环境启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查Docker
Write-Host "[1/5] 检查Docker环境..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $?) {
    Write-Host "错误: Docker未运行，请先启动Docker Desktop" -ForegroundColor Red
    exit 1
}
Write-Host "Docker环境正常" -ForegroundColor Green

# 启动基础服务
Write-Host ""
Write-Host "[2/5] 启动数据库和Redis..." -ForegroundColor Yellow
docker-compose up -d postgres redis
Write-Host "等待数据库就绪..."
Start-Sleep -Seconds 10

# 检查数据库连接
Write-Host ""
Write-Host "[3/5] 验证数据库连接..." -ForegroundColor Yellow
$dbReady = docker exec vaccine-postgres pg_isready -U postgres 2>$null
if ($?) {
    Write-Host "数据库连接成功" -ForegroundColor Green
} else {
    Write-Host "警告: 数据库可能未完全就绪，请稍后重试" -ForegroundColor Yellow
}

# 显示服务状态
Write-Host ""
Write-Host "[4/5] 服务状态:" -ForegroundColor Yellow
docker-compose ps

# 显示连接信息
Write-Host ""
Write-Host "[5/5] 连接信息:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "  用户名: postgres" -ForegroundColor Gray
Write-Host "  密码: postgres123" -ForegroundColor Gray
Write-Host "  数据库: vaccine_db" -ForegroundColor Gray
Write-Host ""
Write-Host "Redis: localhost:6379" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "基础服务已启动！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "1. 启动Go网关:    cd backend/go-gateway && go run cmd/server/main.go" -ForegroundColor White
Write-Host "2. 启动Python服务: cd backend/python-vision && python main.py" -ForegroundColor White
Write-Host "3. 启动前端:       cd frontend/vaccine-monitor && npm run dev" -ForegroundColor White
Write-Host "4. 打开C#项目:     desktop/VaccineControlSystem/VaccineControlSystem.sln" -ForegroundColor White
Write-Host ""

