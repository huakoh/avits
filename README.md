# 🏥 疫苗自动分拣传输控制系统 (VaccineADS)

> Vaccine Automatic Distribution System - 智能疫苗分拣传输解决方案

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)]()
[![GSP](https://img.shields.io/badge/GSP-Compliant-green.svg)]()
[![疫苗法](https://img.shields.io/badge/中国疫苗法-合规-green.svg)]()

## 📋 项目概述

本系统是面向疫苗接种点的智能化分拣传输控制解决方案，采用 **信捷PLC + 视觉识别 + 多语言混合架构**，实现疫苗的自动识别、智能分拣、温控追溯和远程监控。

### 核心特性

- 🎯 **智能分拣**: 支持60种疫苗规格自动识别与分拣
- 🌡️ **全程温控**: 2-8℃冷链温度实时监控与预警
- 📱 **电子追溯**: 疫苗溯源码全流程追踪，符合国家疫苗追溯平台对接标准
- 🔒 **GSP合规**: 满足药品经营质量管理规范要求
- 🖥️ **远程监控**: Web端实时监控与数据分析
- ⚡ **冗余设计**: 关键组件冗余，确保系统高可用

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        远程监控层 (Web)                          │
│                   React + TypeScript + WebSocket                 │
├─────────────────────────────────────────────────────────────────┤
│                        业务服务层 (Go)                           │
│              API Gateway + 业务逻辑 + HIS对接                    │
├─────────────────────────────────────────────────────────────────┤
│                        AI服务层 (Python)                         │
│              视觉识别 + 数据分析 + 温度预测                       │
├─────────────────────────────────────────────────────────────────┤
│                        本地控制层 (C#)                           │
│              WinForms主控 + PLC通信 + 设备管理                   │
├─────────────────────────────────────────────────────────────────┤
│                        设备控制层 (PLC)                          │
│              信捷XC系列 + 传感器 + 执行器                        │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 项目结构

```
JONSON/
├── docs/                           # 📚 项目文档
│   ├── PRD.md                      # 产品需求文档
│   ├── ARCHITECTURE.md             # 系统架构设计
│   ├── DATABASE_DESIGN.md          # 数据库设计
│   ├── API_SPEC.md                 # API接口规范
│   ├── DEVELOPMENT_PLAN.md         # 开发计划
│   └── COMPLIANCE.md               # 合规性文档
│
├── desktop/                        # 🖥️ 桌面应用 (C# WinForms)
│   └── VaccineControlSystem/       # 主控程序
│
├── backend/                        # ⚙️ 后端服务
│   ├── go-gateway/                 # Go API网关
│   ├── python-vision/              # Python视觉识别
│   └── python-analytics/           # Python数据分析
│
├── frontend/                       # 🌐 Web前端
│   └── vaccine-monitor/            # 远程监控系统
│
├── plc/                            # 🔧 PLC程序
│   └── xinje/                      # 信捷PLC程序
│
├── database/                       # 🗄️ 数据库
│   ├── schema/                     # 表结构定义
│   └── migrations/                 # 迁移脚本
│
├── config/                         # ⚙️ 配置文件
│   ├── development/                # 开发环境
│   └── production/                 # 生产环境
│
└── tests/                          # 🧪 测试
    ├── unit/                       # 单元测试
    └── integration/                # 集成测试
```

## 🚀 快速开始

### 环境要求

| 组件 | 版本要求 |
|------|----------|
| .NET Framework | 4.8+ |
| Go | 1.21+ |
| Python | 3.11+ |
| Node.js | 18+ |
| PostgreSQL | 15+ |
| Redis | 7+ |

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-org/vaccine-ads.git

# 2. 安装后端依赖
cd backend/go-gateway && go mod download
cd ../python-vision && pip install -r requirements.txt

# 3. 安装前端依赖
cd frontend/vaccine-monitor && npm install

# 4. 初始化数据库
psql -U postgres -f database/schema/init.sql

# 5. 启动服务
./scripts/start-all.sh
```

## 📊 技术规格

| 指标 | 规格 |
|------|------|
| 日处理能力 | 200-1000支/天 |
| 疫苗规格 | 60种 |
| 温度范围 | 2-8℃ |
| 识别准确率 | ≥99.9% |
| 系统可用性 | ≥99.95% |
| 响应时间 | <100ms |

## 📜 合规认证

- ✅ 《中华人民共和国疫苗管理法》
- ✅ 《药品经营质量管理规范》(GSP)
- ✅ 国家疫苗追溯平台对接标准
- ✅ 医疗器械软件注册技术审查指导原则

## 📞 联系我们

- 技术支持: support@vaccine-ads.com
- 商务合作: business@vaccine-ads.com

---

© 2024 VaccineADS. All rights reserved.

