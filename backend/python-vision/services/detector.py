#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
疫苗检测器 - 基于YOLOv8
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
from loguru import logger

from config import settings


@dataclass
class DetectionResult:
    """检测结果"""
    detected: bool
    confidence: float
    bbox: Optional[Tuple[int, int, int, int]] = None  # x1, y1, x2, y2
    class_name: Optional[str] = None
    

@dataclass 
class BoundingBox:
    """边界框"""
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float
    class_id: int
    class_name: str


class VaccineDetector:
    """疫苗检测器"""
    
    def __init__(self):
        self.model = None
        self.class_names = ["vaccine", "syringe", "vial"]
        self._load_model()
    
    def _load_model(self):
        """加载YOLO模型"""
        model_path = settings.MODEL_PATH / settings.YOLO_MODEL
        
        if not model_path.exists():
            logger.warning(f"模型文件不存在: {model_path}, 使用模拟模式")
            return
        
        try:
            from ultralytics import YOLO
            self.model = YOLO(str(model_path))
            logger.info(f"YOLO模型加载成功: {model_path}")
        except Exception as e:
            logger.error(f"加载YOLO模型失败: {e}")
    
    def detect(self, image: np.ndarray) -> DetectionResult:
        """
        检测图像中的疫苗
        
        Args:
            image: BGR格式的图像
            
        Returns:
            DetectionResult: 检测结果
        """
        if self.model is None:
            # 模拟模式
            return self._simulate_detection(image)
        
        try:
            # 执行检测
            results = self.model(image, verbose=False)
            
            if len(results) == 0 or len(results[0].boxes) == 0:
                return DetectionResult(detected=False, confidence=0.0)
            
            # 获取最高置信度的检测结果
            boxes = results[0].boxes
            best_idx = boxes.conf.argmax().item()
            best_conf = boxes.conf[best_idx].item()
            best_class = int(boxes.cls[best_idx].item())
            best_box = boxes.xyxy[best_idx].cpu().numpy().astype(int)
            
            if best_conf < settings.DETECTION_CONFIDENCE:
                return DetectionResult(detected=False, confidence=best_conf)
            
            return DetectionResult(
                detected=True,
                confidence=best_conf,
                bbox=tuple(best_box),
                class_name=self.class_names[best_class] if best_class < len(self.class_names) else "unknown"
            )
            
        except Exception as e:
            logger.error(f"检测失败: {e}")
            return DetectionResult(detected=False, confidence=0.0)
    
    def detect_all(self, image: np.ndarray) -> List[BoundingBox]:
        """
        检测图像中所有目标
        
        Args:
            image: BGR格式的图像
            
        Returns:
            List[BoundingBox]: 所有检测结果
        """
        if self.model is None:
            return []
        
        try:
            results = self.model(image, verbose=False)
            
            if len(results) == 0:
                return []
            
            detections = []
            for box in results[0].boxes:
                conf = box.conf.item()
                if conf >= settings.DETECTION_CONFIDENCE:
                    xyxy = box.xyxy[0].cpu().numpy().astype(int)
                    class_id = int(box.cls.item())
                    
                    detections.append(BoundingBox(
                        x1=xyxy[0],
                        y1=xyxy[1],
                        x2=xyxy[2],
                        y2=xyxy[3],
                        confidence=conf,
                        class_id=class_id,
                        class_name=self.class_names[class_id] if class_id < len(self.class_names) else "unknown"
                    ))
            
            return detections
            
        except Exception as e:
            logger.error(f"检测失败: {e}")
            return []
    
    def _simulate_detection(self, image: np.ndarray) -> DetectionResult:
        """模拟检测（用于没有模型时的测试）"""
        # 简单的颜色检测模拟
        if image is None or image.size == 0:
            return DetectionResult(detected=False, confidence=0.0)
        
        # 假设检测到疫苗
        h, w = image.shape[:2]
        return DetectionResult(
            detected=True,
            confidence=0.95,
            bbox=(w//4, h//4, w*3//4, h*3//4),
            class_name="vaccine"
        )
    
    def draw_detections(self, image: np.ndarray, detections: List[BoundingBox]) -> np.ndarray:
        """
        在图像上绘制检测结果
        
        Args:
            image: 原始图像
            detections: 检测结果列表
            
        Returns:
            绘制后的图像
        """
        import cv2
        
        result = image.copy()
        
        for det in detections:
            # 绘制边界框
            color = (0, 255, 0)  # 绿色
            cv2.rectangle(result, (det.x1, det.y1), (det.x2, det.y2), color, 2)
            
            # 绘制标签
            label = f"{det.class_name}: {det.confidence:.2f}"
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
            cv2.rectangle(result, (det.x1, det.y1 - 20), (det.x1 + w, det.y1), color, -1)
            cv2.putText(result, label, (det.x1, det.y1 - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        return result

