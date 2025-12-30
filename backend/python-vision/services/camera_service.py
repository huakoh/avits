#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
相机服务 - 支持海康威视工业相机
"""

import asyncio
from abc import ABC, abstractmethod
from typing import Optional

import cv2
import numpy as np
from loguru import logger

from config import settings


class Camera(ABC):
    """相机抽象基类"""
    
    @abstractmethod
    async def open(self) -> bool:
        """打开相机"""
        pass
    
    @abstractmethod
    async def close(self):
        """关闭相机"""
        pass
    
    @abstractmethod
    async def capture(self) -> Optional[np.ndarray]:
        """采集图像"""
        pass
    
    @property
    @abstractmethod
    def is_opened(self) -> bool:
        """相机是否已打开"""
        pass


class HikvisionCamera(Camera):
    """海康威视工业相机"""
    
    def __init__(self, ip: str):
        self.ip = ip
        self._device = None
        self._is_opened = False
    
    async def open(self) -> bool:
        """打开相机"""
        try:
            # 海康MVS SDK调用
            # from MvCameraControl_class import *
            # 这里需要安装海康MVS SDK
            
            logger.info(f"连接海康相机: {self.ip}")
            
            # 模拟连接
            self._is_opened = True
            logger.info("海康相机连接成功")
            return True
            
        except Exception as e:
            logger.error(f"海康相机连接失败: {e}")
            return False
    
    async def close(self):
        """关闭相机"""
        if self._device:
            # self._device.MV_CC_StopGrabbing()
            # self._device.MV_CC_CloseDevice()
            pass
        self._is_opened = False
        logger.info("海康相机已关闭")
    
    async def capture(self) -> Optional[np.ndarray]:
        """采集图像"""
        if not self._is_opened:
            logger.warning("相机未打开")
            return None
        
        try:
            # 实际采集代码
            # ret = self._device.MV_CC_GetOneFrameTimeout(...)
            
            # 模拟返回测试图像
            return self._create_test_image()
            
        except Exception as e:
            logger.error(f"图像采集失败: {e}")
            return None
    
    @property
    def is_opened(self) -> bool:
        return self._is_opened
    
    def _create_test_image(self) -> np.ndarray:
        """创建测试图像"""
        image = np.zeros((settings.CAMERA_HEIGHT, settings.CAMERA_WIDTH, 3), dtype=np.uint8)
        image[:] = (50, 50, 50)  # 灰色背景
        
        # 绘制一个模拟的疫苗瓶
        cv2.rectangle(image, (800, 400), (1120, 700), (200, 200, 200), -1)
        cv2.rectangle(image, (900, 300), (1020, 400), (180, 180, 180), -1)
        
        # 绘制标签区域
        cv2.rectangle(image, (820, 450), (1100, 650), (255, 255, 255), -1)
        cv2.putText(image, "VACCINE", (850, 520), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        cv2.putText(image, "20241229001234567890", (830, 580), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        
        return image


class USBCamera(Camera):
    """USB相机"""
    
    def __init__(self, device_id: int = 0):
        self.device_id = device_id
        self._cap = None
    
    async def open(self) -> bool:
        """打开相机"""
        try:
            self._cap = cv2.VideoCapture(self.device_id)
            if not self._cap.isOpened():
                logger.error(f"无法打开USB相机: {self.device_id}")
                return False
            
            # 设置分辨率
            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, settings.CAMERA_WIDTH)
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, settings.CAMERA_HEIGHT)
            
            logger.info(f"USB相机打开成功: {self.device_id}")
            return True
            
        except Exception as e:
            logger.error(f"USB相机打开失败: {e}")
            return False
    
    async def close(self):
        """关闭相机"""
        if self._cap:
            self._cap.release()
            self._cap = None
        logger.info("USB相机已关闭")
    
    async def capture(self) -> Optional[np.ndarray]:
        """采集图像"""
        if not self.is_opened:
            return None
        
        ret, frame = self._cap.read()
        if ret:
            return frame
        return None
    
    @property
    def is_opened(self) -> bool:
        return self._cap is not None and self._cap.isOpened()


class CameraManager:
    """相机管理器"""
    
    def __init__(self):
        self.camera: Optional[Camera] = None
    
    async def initialize(self) -> bool:
        """初始化相机"""
        if not settings.CAMERA_ENABLED:
            logger.info("相机功能已禁用")
            return True
        
        try:
            # 根据配置选择相机类型
            if settings.CAMERA_TYPE == "hikvision":
                self.camera = HikvisionCamera(settings.CAMERA_IP)
            elif settings.CAMERA_TYPE == "usb":
                self.camera = USBCamera(0)
            else:
                logger.warning(f"未知的相机类型: {settings.CAMERA_TYPE}")
                self.camera = HikvisionCamera(settings.CAMERA_IP)
            
            success = await self.camera.open()
            if not success:
                logger.error("相机初始化失败")
                return False
            
            logger.info("相机初始化成功")
            return True
            
        except Exception as e:
            logger.exception(f"相机初始化异常: {e}")
            return False
    
    async def capture(self) -> Optional[np.ndarray]:
        """采集图像"""
        if self.camera is None:
            # 返回测试图像
            return self._create_fallback_image()
        
        image = await self.camera.capture()
        if image is None:
            logger.warning("图像采集失败，使用后备图像")
            return self._create_fallback_image()
        
        return image
    
    async def cleanup(self):
        """清理资源"""
        if self.camera:
            await self.camera.close()
            self.camera = None
    
    def _create_fallback_image(self) -> np.ndarray:
        """创建后备图像"""
        image = np.zeros((settings.CAMERA_HEIGHT, settings.CAMERA_WIDTH, 3), dtype=np.uint8)
        cv2.putText(image, "Camera Offline", (700, 540), 
                   cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 3)
        return image

