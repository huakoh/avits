#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
疫苗视觉识别服务
提供疫苗识别、条码扫描、视觉验证等功能
"""

import asyncio
import signal
import sys
from concurrent import futures

import grpc
from loguru import logger

from config import settings
from services.vision_service import VisionServicer
from services.camera_service import CameraManager
from protos import vision_pb2_grpc


def configure_logging():
    """配置日志"""
    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
               "<level>{level: <8}</level> | "
               "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
               "<level>{message}</level>"
    )
    logger.add(
        settings.LOG_PATH / "vision_{time:YYYY-MM-DD}.log",
        level=settings.LOG_LEVEL,
        rotation="00:00",
        retention="30 days",
        compression="zip"
    )


async def serve():
    """启动gRPC服务"""
    # 初始化相机管理器
    camera_manager = CameraManager()
    if settings.CAMERA_ENABLED:
        await camera_manager.initialize()
    
    # 创建gRPC服务器
    server = grpc.aio.server(
        futures.ThreadPoolExecutor(max_workers=settings.GRPC_MAX_WORKERS),
        options=[
            ('grpc.max_receive_message_length', 50 * 1024 * 1024),  # 50MB
            ('grpc.max_send_message_length', 50 * 1024 * 1024),
        ]
    )
    
    # 注册服务
    vision_servicer = VisionServicer(camera_manager)
    vision_pb2_grpc.add_VisionServiceServicer_to_server(vision_servicer, server)
    
    # 绑定端口
    listen_addr = f"[::]:{settings.GRPC_PORT}"
    server.add_insecure_port(listen_addr)
    
    logger.info(f"视觉识别服务启动于 {listen_addr}")
    
    await server.start()
    
    # 优雅关闭
    async def shutdown():
        logger.info("正在关闭服务...")
        await camera_manager.cleanup()
        await server.stop(5)
        logger.info("服务已关闭")
    
    # 注册信号处理
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown()))
    
    await server.wait_for_termination()


def main():
    """主入口"""
    configure_logging()
    
    logger.info("=" * 50)
    logger.info("疫苗视觉识别服务启动")
    logger.info(f"版本: {settings.VERSION}")
    logger.info("=" * 50)
    
    try:
        asyncio.run(serve())
    except KeyboardInterrupt:
        logger.info("收到中断信号，服务退出")
    except Exception as e:
        logger.exception(f"服务异常退出: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

