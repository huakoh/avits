#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配置管理
"""

from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    
    # 基础信息
    APP_NAME: str = "疫苗视觉识别服务"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # gRPC配置
    GRPC_PORT: int = 5001
    GRPC_MAX_WORKERS: int = 10
    
    # 日志配置
    LOG_LEVEL: str = "DEBUG"
    LOG_PATH: Path = Path("logs")
    
    # 相机配置
    CAMERA_ENABLED: bool = True
    CAMERA_IP: str = "192.168.1.200"
    CAMERA_TYPE: str = "hikvision"  # hikvision / basler / usb
    CAMERA_WIDTH: int = 1920
    CAMERA_HEIGHT: int = 1080
    CAMERA_FPS: int = 30
    CAMERA_EXPOSURE: int = 10000  # 微秒
    
    # 模型配置
    MODEL_PATH: Path = Path("models")
    YOLO_MODEL: str = "yolo_vaccine.pt"
    OCR_MODEL: str = "ocr_model"
    DETECTION_CONFIDENCE: float = 0.85
    
    # 条码配置
    BARCODE_TIMEOUT: float = 3.0  # 秒
    BARCODE_RETRY: int = 3
    
    # 图像保存
    IMAGE_SAVE_ENABLED: bool = True
    IMAGE_SAVE_PATH: Path = Path("images")
    IMAGE_RETENTION_DAYS: int = 30
    
    # Redis配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    
    # 数据库配置
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/vaccine_db"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 全局配置实例
settings = Settings()

# 确保目录存在
settings.LOG_PATH.mkdir(parents=True, exist_ok=True)
settings.MODEL_PATH.mkdir(parents=True, exist_ok=True)
settings.IMAGE_SAVE_PATH.mkdir(parents=True, exist_ok=True)

