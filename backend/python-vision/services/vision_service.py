#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视觉识别服务实现
"""

import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np
from loguru import logger
from pyzbar import pyzbar

from config import settings
from services.camera_service import CameraManager
from services.detector import VaccineDetector
from services.ocr_service import OCRService


class VisionServicer:
    """视觉识别gRPC服务实现"""
    
    def __init__(self, camera_manager: CameraManager):
        self.camera_manager = camera_manager
        self.detector = VaccineDetector()
        self.ocr_service = OCRService()
        
    async def RecognizeVaccine(self, request, context):
        """识别疫苗"""
        logger.info("收到疫苗识别请求")
        
        try:
            # 获取图像
            if request.image:
                # 使用请求中的图像
                image = self._decode_image(request.image)
            else:
                # 从相机采集
                image = await self.camera_manager.capture()
            
            if image is None:
                return self._create_recognize_response(
                    success=False,
                    message="无法获取图像"
                )
            
            # 检测疫苗
            detection_result = self.detector.detect(image)
            if not detection_result.detected:
                return self._create_recognize_response(
                    success=False,
                    message="未检测到疫苗"
                )
            
            # 扫描条码
            trace_code = self._scan_barcode(image)
            
            # OCR识别
            ocr_result = self.ocr_service.recognize(image)
            
            # 保存图像
            image_path = self._save_image(image, trace_code or "unknown")
            
            # 与预期对比
            if request.expected_vaccine_code:
                matched = self._match_vaccine_code(
                    ocr_result.vaccine_code,
                    request.expected_vaccine_code
                )
                if not matched:
                    return self._create_recognize_response(
                        success=False,
                        message="疫苗类型不匹配",
                        trace_code=trace_code,
                        image_path=str(image_path)
                    )
            
            return self._create_recognize_response(
                success=True,
                message="识别成功",
                vaccine_code=ocr_result.vaccine_code,
                trace_code=trace_code,
                confidence=detection_result.confidence,
                image_path=str(image_path)
            )
            
        except Exception as e:
            logger.exception(f"疫苗识别失败: {e}")
            return self._create_recognize_response(
                success=False,
                message=f"识别异常: {str(e)}"
            )
    
    async def ScanBarcode(self, request, context):
        """扫描条码"""
        logger.info("收到条码扫描请求")
        
        try:
            # 获取图像
            if request.image:
                image = self._decode_image(request.image)
            else:
                image = await self.camera_manager.capture()
            
            if image is None:
                return self._create_scan_response(
                    success=False,
                    message="无法获取图像"
                )
            
            # 扫描条码
            barcode = self._scan_barcode(image)
            
            if barcode:
                return self._create_scan_response(
                    success=True,
                    message="扫描成功",
                    barcode=barcode
                )
            else:
                return self._create_scan_response(
                    success=False,
                    message="未检测到条码"
                )
                
        except Exception as e:
            logger.exception(f"条码扫描失败: {e}")
            return self._create_scan_response(
                success=False,
                message=f"扫描异常: {str(e)}"
            )
    
    async def VerifyVaccine(self, request, context):
        """验证疫苗"""
        logger.info(f"收到疫苗验证请求: 预期溯源码={request.expected_trace_code}")
        
        try:
            # 获取图像
            if request.image:
                image = self._decode_image(request.image)
            else:
                image = await self.camera_manager.capture()
            
            if image is None:
                return self._create_verify_response(
                    matched=False,
                    message="无法获取图像"
                )
            
            # 多次尝试扫描条码
            trace_code = None
            for i in range(settings.BARCODE_RETRY):
                trace_code = self._scan_barcode(image)
                if trace_code:
                    break
                if i < settings.BARCODE_RETRY - 1:
                    # 重新采集图像
                    await self._wait(0.3)
                    image = await self.camera_manager.capture()
            
            if not trace_code:
                return self._create_verify_response(
                    matched=False,
                    message="无法识别溯源码"
                )
            
            # 比对溯源码
            matched = trace_code == request.expected_trace_code
            
            # 保存图像
            image_path = self._save_image(image, trace_code)
            
            if matched:
                logger.info(f"疫苗验证通过: {trace_code}")
                return self._create_verify_response(
                    matched=True,
                    message="验证通过",
                    actual_trace_code=trace_code,
                    confidence=1.0,
                    image_path=str(image_path)
                )
            else:
                logger.warning(f"疫苗验证失败: 预期={request.expected_trace_code}, 实际={trace_code}")
                return self._create_verify_response(
                    matched=False,
                    message="溯源码不匹配",
                    actual_trace_code=trace_code,
                    image_path=str(image_path)
                )
                
        except Exception as e:
            logger.exception(f"疫苗验证失败: {e}")
            return self._create_verify_response(
                matched=False,
                message=f"验证异常: {str(e)}"
            )
    
    def _decode_image(self, image_bytes: bytes) -> Optional[np.ndarray]:
        """解码图像"""
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return image
        except Exception as e:
            logger.error(f"图像解码失败: {e}")
            return None
    
    def _scan_barcode(self, image: np.ndarray) -> Optional[str]:
        """扫描条码/二维码"""
        try:
            # 转为灰度图
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 图像增强
            gray = cv2.GaussianBlur(gray, (5, 5), 0)
            gray = cv2.adaptiveThreshold(
                gray, 255, 
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2
            )
            
            # 解码条码
            barcodes = pyzbar.decode(gray)
            
            for barcode in barcodes:
                data = barcode.data.decode('utf-8')
                barcode_type = barcode.type
                logger.debug(f"检测到条码: 类型={barcode_type}, 数据={data}")
                
                # 验证溯源码格式 (20位数字)
                if len(data) == 20 and data.isdigit():
                    return data
            
            # 如果没找到，尝试原图
            barcodes = pyzbar.decode(image)
            for barcode in barcodes:
                data = barcode.data.decode('utf-8')
                if len(data) == 20 and data.isdigit():
                    return data
            
            return None
            
        except Exception as e:
            logger.error(f"条码扫描失败: {e}")
            return None
    
    def _match_vaccine_code(self, detected: Optional[str], expected: str) -> bool:
        """匹配疫苗编码"""
        if not detected:
            return False
        return detected.strip().upper() == expected.strip().upper()
    
    def _save_image(self, image: np.ndarray, identifier: str) -> Path:
        """保存图像"""
        if not settings.IMAGE_SAVE_ENABLED:
            return Path("")
        
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"{identifier}_{timestamp}.jpg"
            date_folder = datetime.now().strftime("%Y%m%d")
            
            save_dir = settings.IMAGE_SAVE_PATH / date_folder
            save_dir.mkdir(parents=True, exist_ok=True)
            
            save_path = save_dir / filename
            cv2.imwrite(str(save_path), image)
            
            logger.debug(f"图像已保存: {save_path}")
            return save_path
            
        except Exception as e:
            logger.error(f"保存图像失败: {e}")
            return Path("")
    
    async def _wait(self, seconds: float):
        """等待"""
        import asyncio
        await asyncio.sleep(seconds)
    
    def _create_recognize_response(self, **kwargs):
        """创建识别响应"""
        from protos import vision_pb2
        return vision_pb2.RecognizeResponse(**kwargs)
    
    def _create_scan_response(self, **kwargs):
        """创建扫描响应"""
        from protos import vision_pb2
        return vision_pb2.ScanResponse(**kwargs)
    
    def _create_verify_response(self, **kwargs):
        """创建验证响应"""
        from protos import vision_pb2
        return vision_pb2.VerifyResponse(**kwargs)

