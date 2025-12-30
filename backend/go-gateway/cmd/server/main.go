package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"vaccine-gateway/internal/config"
	"vaccine-gateway/internal/handler"
	"vaccine-gateway/internal/middleware"
	"vaccine-gateway/internal/repository"
	"vaccine-gateway/internal/service"
	"vaccine-gateway/pkg/database"
	"vaccine-gateway/pkg/logger"
	"vaccine-gateway/pkg/redis"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化配置
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("加载配置失败: %v\n", err)
		os.Exit(1)
	}

	// 初始化日志
	log := logger.New(cfg.Log.Level, cfg.Log.Path)
	log.Info("疫苗分拣网关服务启动中...")

	// 初始化数据库
	db, err := database.New(cfg.Database)
	if err != nil {
		log.Fatal("数据库连接失败", "error", err)
	}
	log.Info("数据库连接成功")

	// 初始化Redis
	rdb, err := redis.New(cfg.Redis)
	if err != nil {
		log.Fatal("Redis连接失败", "error", err)
	}
	log.Info("Redis连接成功")

	// 初始化仓库层
	vaccineRepo := repository.NewVaccineRepository(db)
	inventoryRepo := repository.NewInventoryRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	channelRepo := repository.NewChannelRepository(db)
	traceRepo := repository.NewTraceRepository(db)
	alarmRepo := repository.NewAlarmRepository(db)
	userRepo := repository.NewUserRepository(db)

	// 初始化服务层
	vaccineService := service.NewVaccineService(vaccineRepo)
	inventoryService := service.NewInventoryService(inventoryRepo, vaccineRepo, channelRepo, traceRepo)
	orderService := service.NewOrderService(orderRepo, inventoryRepo, rdb)
	sortingService := service.NewSortingService(orderRepo, inventoryRepo, channelRepo, rdb)
	traceService := service.NewTraceService(traceRepo, inventoryRepo)
	temperatureService := service.NewTemperatureService(rdb)
	alarmService := service.NewAlarmService(alarmRepo, rdb)
	authService := service.NewAuthService(userRepo, cfg.JWT)

	// 设置Gin模式
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建Gin引擎
	r := gin.New()

	// 注册中间件
	r.Use(gin.Recovery())
	r.Use(middleware.Logger(log))
	r.Use(middleware.CORS())
	r.Use(middleware.RateLimiter(cfg.RateLimit))

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 认证接口 (无需鉴权)
		auth := v1.Group("/auth")
		{
			authHandler := handler.NewAuthHandler(authService)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
		}

		// 需要鉴权的接口
		protected := v1.Group("")
		protected.Use(middleware.JWT(cfg.JWT.Secret))
		{
			// 疫苗管理
			vaccines := protected.Group("/vaccines")
			{
				h := handler.NewVaccineHandler(vaccineService)
				vaccines.GET("", h.List)
				vaccines.GET("/:id", h.Get)
				vaccines.POST("", middleware.RequirePermission("vaccine:create"), h.Create)
				vaccines.PUT("/:id", middleware.RequirePermission("vaccine:update"), h.Update)
				vaccines.DELETE("/:id", middleware.RequirePermission("vaccine:delete"), h.Delete)
			}

			// 库存管理
			inventory := protected.Group("/inventory")
			{
				h := handler.NewInventoryHandler(inventoryService)
				inventory.GET("", h.List)
				inventory.GET("/summary", h.Summary)
				inventory.POST("/inbound", middleware.RequirePermission("inventory:inbound"), h.Inbound)
				inventory.POST("/outbound", middleware.RequirePermission("inventory:outbound"), h.Outbound)
			}

			// 订单管理
			orders := protected.Group("/orders")
			{
				h := handler.NewOrderHandler(orderService, sortingService)
				orders.GET("", h.List)
				orders.GET("/:id", h.Get)
				orders.POST("", h.Create)
				orders.POST("/:id/process", h.Process)
				orders.POST("/:id/cancel", h.Cancel)
			}

			// 货道管理
			channels := protected.Group("/channels")
			{
				h := handler.NewChannelHandler(channelRepo)
				channels.GET("", h.List)
				channels.GET("/matrix", h.Matrix)
				channels.PUT("/:id", middleware.RequirePermission("channel:update"), h.Update)
			}

			// 温度监控
			temperature := protected.Group("/temperature")
			{
				h := handler.NewTemperatureHandler(temperatureService)
				temperature.GET("/current", h.Current)
				temperature.GET("/history", h.History)
				temperature.GET("/report", h.Report)
			}

			// 追溯查询
			traces := protected.Group("/traces")
			{
				h := handler.NewTraceHandler(traceService)
				traces.GET("/:trace_code", h.Query)
				traces.GET("/batch/:batch_no", h.BatchQuery)
			}

			// 报警管理
			alarms := protected.Group("/alarms")
			{
				h := handler.NewAlarmHandler(alarmService)
				alarms.GET("", h.List)
				alarms.POST("/:id/handle", middleware.RequirePermission("alarm:handle"), h.Handle)
			}

			// 统计报表
			statistics := protected.Group("/statistics")
			{
				h := handler.NewStatisticsHandler(inventoryService, orderService, alarmService)
				statistics.GET("/overview", h.Overview)
				statistics.GET("/inventory", h.Inventory)
			}
		}
	}

	// HIS系统对接接口
	his := r.Group("/his")
	his.Use(middleware.HISAuth(cfg.HIS.APIKey))
	{
		h := handler.NewHISHandler(orderService)
		his.POST("/orders", h.ReceiveOrder)
	}

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Server.Port),
		Handler: r,
	}

	// 启动服务器
	go func() {
		log.Info("HTTP服务启动", "port", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("HTTP服务启动失败", "error", err)
		}
	}()

	// 启动WebSocket服务
	go startWebSocketServer(cfg.Server.WSPort, temperatureService, alarmService, orderService, log)

	// 启动gRPC服务
	go startGRPCServer(cfg.Server.GRPCPort, sortingService, log)

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("正在关闭服务...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error("HTTP服务关闭失败", "error", err)
	}

	log.Info("服务已关闭")
}

// startWebSocketServer 启动WebSocket服务
func startWebSocketServer(port int, tempService *service.TemperatureService, 
	alarmService *service.AlarmService, orderService *service.OrderService, log *logger.Logger) {
	// WebSocket实现略
	log.Info("WebSocket服务启动", "port", port)
}

// startGRPCServer 启动gRPC服务
func startGRPCServer(port int, sortingService *service.SortingService, log *logger.Logger) {
	// gRPC实现略
	log.Info("gRPC服务启动", "port", port)
}

