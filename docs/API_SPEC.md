# API接口规范文档

> 文档版本: v1.0.0  
> 更新日期: 2024-12-29

---

## 1. 概述

### 1.1 API基础信息

| 项目 | 说明 |
|------|------|
| 基础URL | `https://api.vaccine-ads.local/v1` |
| 协议 | HTTPS (TLS 1.3) |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601 (yyyy-MM-ddTHH:mm:ssZ) |

### 1.2 认证方式

所有API请求需要在Header中携带JWT Token：

```http
Authorization: Bearer <jwt_token>
```

### 1.3 通用响应格式

```json
{
    "code": 200,
    "message": "success",
    "data": { },
    "timestamp": "2024-12-29T10:30:00Z",
    "request_id": "req_abc123"
}
```

### 1.4 错误码定义

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |

---

## 2. 认证接口

### 2.1 用户登录

**POST** `/auth/login`

请求体：
```json
{
    "username": "admin",
    "password": "encrypted_password",
    "captcha": "1234",
    "captcha_id": "cap_xxx"
}
```

响应：
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
        "expires_in": 7200,
        "token_type": "Bearer",
        "user": {
            "id": 1,
            "username": "admin",
            "real_name": "管理员",
            "roles": ["ADMIN"],
            "permissions": ["vaccine:view", "inventory:view"]
        }
    }
}
```

### 2.2 刷新Token

**POST** `/auth/refresh`

请求体：
```json
{
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.3 用户登出

**POST** `/auth/logout`

---

## 3. 疫苗管理接口

### 3.1 疫苗列表

**GET** `/vaccines`

查询参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页数量，默认20 |
| keyword | string | 否 | 搜索关键词 |
| category | string | 否 | 疫苗类别 |
| status | int | 否 | 状态 |

响应：
```json
{
    "code": 200,
    "data": {
        "list": [
            {
                "id": 1,
                "code": "VAC001",
                "name": "乙型肝炎疫苗(酿酒酵母)",
                "common_name": "乙肝疫苗",
                "manufacturer": "北京天坛生物",
                "specification": "10μg/0.5ml",
                "category": "一类",
                "storage_temp_min": 2.0,
                "storage_temp_max": 8.0,
                "status": 1
            }
        ],
        "total": 60,
        "page": 1,
        "page_size": 20
    }
}
```

### 3.2 疫苗详情

**GET** `/vaccines/{id}`

### 3.3 创建疫苗

**POST** `/vaccines`

请求体：
```json
{
    "code": "VAC061",
    "name": "流感病毒裂解疫苗",
    "manufacturer": "华兰生物",
    "specification": "0.5ml/支",
    "category": "二类",
    "storage_temp_min": 2.0,
    "storage_temp_max": 8.0,
    "dose_count": 1,
    "applicable_age": "6月龄及以上"
}
```

### 3.4 更新疫苗

**PUT** `/vaccines/{id}`

### 3.5 删除疫苗

**DELETE** `/vaccines/{id}`

---

## 4. 库存管理接口

### 4.1 库存列表

**GET** `/inventory`

查询参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| vaccine_id | int | 否 | 疫苗ID |
| batch_no | string | 否 | 批次号 |
| channel_id | int | 否 | 货道ID |
| status | int | 否 | 状态: 1在库 2已出库 |
| expiry_before | date | 否 | 有效期截止日期 |

响应：
```json
{
    "code": 200,
    "data": {
        "list": [
            {
                "id": 1,
                "vaccine": {
                    "id": 1,
                    "code": "VAC001",
                    "name": "乙肝疫苗"
                },
                "batch_no": "B20241201",
                "trace_code": "20241229001234567890",
                "production_date": "2024-12-01",
                "expiry_date": "2025-12-01",
                "channel": {
                    "id": 1,
                    "position": "A1"
                },
                "status": 1,
                "inbound_time": "2024-12-29T08:00:00Z",
                "inbound_temp": 5.2
            }
        ],
        "total": 2340
    }
}
```

### 4.2 库存汇总

**GET** `/inventory/summary`

响应：
```json
{
    "code": 200,
    "data": {
        "total_count": 2340,
        "vaccine_types": 60,
        "by_vaccine": [
            {
                "vaccine_id": 1,
                "vaccine_name": "乙肝疫苗",
                "count": 150,
                "batches": 3,
                "nearest_expiry": "2025-06-01",
                "expiring_soon": 20
            }
        ],
        "expiring_soon_total": 45,
        "low_stock_count": 3
    }
}
```

### 4.3 疫苗入库

**POST** `/inventory/inbound`

请求体：
```json
{
    "vaccine_id": 1,
    "batch_no": "B20241229",
    "trace_codes": [
        "20241229001234567890",
        "20241229001234567891"
    ],
    "production_date": "2024-12-20",
    "expiry_date": "2025-12-20",
    "supplier": "北京天坛生物",
    "purchase_order": "PO20241229001",
    "inbound_temp": 5.0,
    "channel_id": 1
}
```

响应：
```json
{
    "code": 200,
    "data": {
        "success_count": 2,
        "failed_count": 0,
        "results": [
            {
                "trace_code": "20241229001234567890",
                "inventory_id": 1001,
                "channel_position": "A1",
                "status": "success"
            }
        ]
    }
}
```

### 4.4 疫苗出库

**POST** `/inventory/outbound`

请求体：
```json
{
    "order_id": 1,
    "items": [
        {
            "inventory_id": 1001,
            "trace_code": "20241229001234567890"
        }
    ]
}
```

### 4.5 库存盘点

**POST** `/inventory/stocktake`

请求体：
```json
{
    "channel_id": 1,
    "actual_quantity": 18,
    "remark": "盘点确认"
}
```

---

## 5. 订单管理接口

### 5.1 订单列表

**GET** `/orders`

查询参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | int | 否 | 订单状态 |
| patient_id | string | 否 | 患者ID |
| start_date | date | 否 | 开始日期 |
| end_date | date | 否 | 结束日期 |

响应：
```json
{
    "code": 200,
    "data": {
        "list": [
            {
                "id": 1,
                "order_no": "ORD202412290001",
                "his_order_id": "HIS12345",
                "patient_id": "P123456",
                "patient_name": "张**",
                "vaccine": {
                    "id": 1,
                    "name": "乙肝疫苗"
                },
                "quantity": 1,
                "dose_number": 1,
                "priority": 1,
                "status": 2,
                "receive_time": "2024-12-29T10:30:00Z",
                "complete_time": "2024-12-29T10:30:15Z",
                "items": [
                    {
                        "trace_code": "20241229001234567890",
                        "batch_no": "B20241201",
                        "channel_position": "A1"
                    }
                ]
            }
        ],
        "total": 156
    }
}
```

### 5.2 创建订单

**POST** `/orders`

请求体：
```json
{
    "his_order_id": "HIS12345",
    "patient_id": "P123456",
    "patient_name": "张三",
    "vaccine_id": 1,
    "quantity": 1,
    "dose_number": 1,
    "priority": 1
}
```

### 5.3 处理订单

**POST** `/orders/{id}/process`

此接口触发分拣流程，系统自动完成：
1. 选择最优货道
2. 发送PLC指令
3. 视觉复核
4. 更新库存
5. 生成追溯记录

响应：
```json
{
    "code": 200,
    "data": {
        "order_id": 1,
        "status": "processing",
        "channel_position": "A1",
        "estimated_time": 15
    }
}
```

### 5.4 取消订单

**POST** `/orders/{id}/cancel`

请求体：
```json
{
    "reason": "患者取消接种"
}
```

### 5.5 订单状态WebSocket

**WebSocket** `/ws/orders`

订阅订单状态变更，实时推送：

```json
{
    "type": "order_status",
    "data": {
        "order_id": 1,
        "order_no": "ORD202412290001",
        "status": 2,
        "status_name": "已完成",
        "message": "分拣完成",
        "timestamp": "2024-12-29T10:30:15Z"
    }
}
```

---

## 6. 货道管理接口

### 6.1 货道列表

**GET** `/channels`

响应：
```json
{
    "code": 200,
    "data": {
        "list": [
            {
                "id": 1,
                "position": "A1",
                "row_index": "A",
                "col_index": 1,
                "vaccine": {
                    "id": 1,
                    "code": "VAC001",
                    "name": "乙肝疫苗"
                },
                "capacity": 20,
                "quantity": 18,
                "status": 1,
                "last_outbound": "2024-12-29T10:30:15Z"
            }
        ],
        "total": 60
    }
}
```

### 6.2 货道矩阵视图

**GET** `/channels/matrix`

响应：
```json
{
    "code": 200,
    "data": {
        "rows": ["A", "B", "C", "D", "E", "F"],
        "cols": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "matrix": [
            [
                {"position": "A1", "vaccine_name": "乙肝疫苗", "quantity": 18, "status": 1},
                {"position": "A2", "vaccine_name": "流感疫苗", "quantity": 15, "status": 1}
            ]
        ]
    }
}
```

### 6.3 配置货道

**PUT** `/channels/{id}`

请求体：
```json
{
    "vaccine_id": 1,
    "capacity": 20,
    "status": 1
}
```

### 6.4 货道出货测试

**POST** `/channels/{id}/test`

手动触发货道出货（测试用）。

---

## 7. 温度监控接口

### 7.1 当前温度

**GET** `/temperature/current`

响应：
```json
{
    "code": 200,
    "data": {
        "channels": [
            {
                "channel_id": 1,
                "position": "A1",
                "temperature": 5.2,
                "humidity": 45.0,
                "status": "normal",
                "recorded_at": "2024-12-29T10:30:00Z"
            }
        ],
        "average_temp": 5.0,
        "min_temp": 3.2,
        "max_temp": 6.8,
        "alarm_count": 0
    }
}
```

### 7.2 温度历史

**GET** `/temperature/history`

查询参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| channel_id | int | 否 | 货道ID |
| start_time | datetime | 是 | 开始时间 |
| end_time | datetime | 是 | 结束时间 |
| interval | string | 否 | 聚合间隔: 1m/5m/1h/1d |

响应：
```json
{
    "code": 200,
    "data": {
        "channel_id": 1,
        "position": "A1",
        "records": [
            {
                "time": "2024-12-29T10:00:00Z",
                "avg_temp": 5.1,
                "min_temp": 4.8,
                "max_temp": 5.4
            }
        ]
    }
}
```

### 7.3 温度WebSocket

**WebSocket** `/ws/temperature`

实时温度推送（每30秒）：

```json
{
    "type": "temperature",
    "data": {
        "channels": [
            {
                "channel_id": 1,
                "position": "A1",
                "temperature": 5.2,
                "is_alarm": false
            }
        ],
        "timestamp": "2024-12-29T10:30:00Z"
    }
}
```

### 7.4 温度报表

**GET** `/temperature/report`

查询参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | date | 是 | 报表日期 |
| format | string | 否 | 格式: json/pdf/excel |

---

## 8. 追溯管理接口

### 8.1 溯源码查询

**GET** `/traces/{trace_code}`

响应：
```json
{
    "code": 200,
    "data": {
        "trace_code": "20241229001234567890",
        "vaccine": {
            "code": "VAC001",
            "name": "乙肝疫苗",
            "manufacturer": "北京天坛生物"
        },
        "batch_no": "B20241201",
        "production_date": "2024-12-01",
        "expiry_date": "2025-12-01",
        "current_status": "已接种",
        "timeline": [
            {
                "operation": "INBOUND",
                "operation_name": "入库",
                "location": "A1货道",
                "temperature": 5.0,
                "operator": "张三",
                "time": "2024-12-29T08:00:00Z"
            },
            {
                "operation": "OUTBOUND",
                "operation_name": "出库",
                "location": "出库口",
                "temperature": 5.2,
                "operator": "系统",
                "order_no": "ORD202412290001",
                "time": "2024-12-29T10:30:15Z"
            },
            {
                "operation": "INOCULATE",
                "operation_name": "接种",
                "patient_id": "P123456",
                "time": "2024-12-29T10:35:00Z"
            }
        ]
    }
}
```

### 8.2 批次追溯

**GET** `/traces/batch/{batch_no}`

响应：
```json
{
    "code": 200,
    "data": {
        "batch_no": "B20241201",
        "vaccine": {
            "code": "VAC001",
            "name": "乙肝疫苗"
        },
        "total_count": 100,
        "in_stock": 45,
        "outbound": 55,
        "items": [
            {
                "trace_code": "20241229001234567890",
                "status": "已接种",
                "channel_position": "A1"
            }
        ]
    }
}
```

### 8.3 上报国家追溯平台

**POST** `/traces/report`

请求体：
```json
{
    "trace_codes": [
        "20241229001234567890"
    ],
    "operation": "INOCULATE"
}
```

---

## 9. 报警管理接口

### 9.1 报警列表

**GET** `/alarms`

查询参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | int | 否 | 状态: 0未处理 1已处理 |
| level | int | 否 | 级别 |
| type | string | 否 | 类型 |

响应：
```json
{
    "code": 200,
    "data": {
        "list": [
            {
                "id": 1,
                "alarm_code": "TEMP_HIGH",
                "alarm_type": "温度超上限",
                "level": 4,
                "level_name": "紧急",
                "source": "A1货道",
                "message": "A1货道温度8.5℃超过上限8℃",
                "status": 0,
                "alarm_time": "2024-12-29T10:30:00Z"
            }
        ],
        "unhandled_count": 5
    }
}
```

### 9.2 处理报警

**POST** `/alarms/{id}/handle`

请求体：
```json
{
    "handle_result": "已检查制冷设备，温度恢复正常"
}
```

### 9.3 报警WebSocket

**WebSocket** `/ws/alarms`

实时报警推送：

```json
{
    "type": "alarm",
    "data": {
        "id": 1,
        "alarm_code": "TEMP_HIGH",
        "level": 4,
        "message": "A1货道温度8.5℃超过上限8℃",
        "timestamp": "2024-12-29T10:30:00Z"
    }
}
```

---

## 10. 设备管理接口

### 10.1 设备列表

**GET** `/devices`

响应：
```json
{
    "code": 200,
    "data": {
        "list": [
            {
                "id": 1,
                "name": "主PLC",
                "code": "PLC_MAIN",
                "type": "PLC",
                "model": "XC3-60RT",
                "ip_address": "192.168.1.100",
                "status": 1,
                "status_name": "在线",
                "last_heartbeat": "2024-12-29T10:30:00Z"
            }
        ]
    }
}
```

### 10.2 设备状态WebSocket

**WebSocket** `/ws/devices`

实时设备状态推送：

```json
{
    "type": "device_status",
    "data": {
        "devices": [
            {
                "id": 1,
                "code": "PLC_MAIN",
                "status": 1,
                "cpu_usage": 25.5,
                "memory_usage": 60.2
            }
        ],
        "timestamp": "2024-12-29T10:30:00Z"
    }
}
```

---

## 11. 统计报表接口

### 11.1 运营概览

**GET** `/statistics/overview`

响应：
```json
{
    "code": 200,
    "data": {
        "today": {
            "inbound_count": 50,
            "outbound_count": 156,
            "order_count": 160,
            "alarm_count": 2
        },
        "this_week": {
            "inbound_count": 320,
            "outbound_count": 980
        },
        "this_month": {
            "inbound_count": 1200,
            "outbound_count": 4500
        },
        "inventory": {
            "total_count": 2340,
            "vaccine_types": 60,
            "expiring_soon": 45
        },
        "device": {
            "online_count": 5,
            "offline_count": 0,
            "fault_count": 0
        }
    }
}
```

### 11.2 出入库统计

**GET** `/statistics/inventory`

查询参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | date | 是 | 开始日期 |
| end_date | date | 是 | 结束日期 |
| group_by | string | 否 | 分组: day/week/month |

响应：
```json
{
    "code": 200,
    "data": {
        "inbound": [
            {"date": "2024-12-29", "count": 50}
        ],
        "outbound": [
            {"date": "2024-12-29", "count": 156}
        ],
        "by_vaccine": [
            {
                "vaccine_name": "乙肝疫苗",
                "inbound": 20,
                "outbound": 45
            }
        ]
    }
}
```

---

## 12. HIS系统对接接口

### 12.1 接收接种订单 (HIS → 本系统)

**POST** `/his/orders`

请求体 (HL7 FHIR格式)：
```json
{
    "resourceType": "MedicationRequest",
    "identifier": [
        {
            "system": "his-order-id",
            "value": "HIS12345"
        }
    ],
    "subject": {
        "identifier": {
            "value": "P123456"
        },
        "display": "张三"
    },
    "medicationCodeableConcept": {
        "coding": [
            {
                "system": "vaccine-code",
                "code": "VAC001",
                "display": "乙肝疫苗"
            }
        ]
    },
    "dosageInstruction": [
        {
            "sequence": 1,
            "text": "第1剂"
        }
    ],
    "authoredOn": "2024-12-29T10:30:00Z"
}
```

### 12.2 推送出库结果 (本系统 → HIS)

**POST** `{HIS_CALLBACK_URL}`

请求体：
```json
{
    "his_order_id": "HIS12345",
    "order_no": "ORD202412290001",
    "status": "completed",
    "trace_code": "20241229001234567890",
    "batch_no": "B20241201",
    "expiry_date": "2025-12-01",
    "manufacturer": "北京天坛生物",
    "outbound_time": "2024-12-29T10:30:15Z",
    "temperature": 5.2
}
```

---

## 13. gRPC接口定义

### 13.1 主控服务 (C# ↔ Go)

```protobuf
syntax = "proto3";

package vaccine;

// 分拣服务
service SortingService {
    // 执行分拣
    rpc ExecuteSort(SortRequest) returns (SortResponse);
    // 获取任务状态
    rpc GetTaskStatus(TaskStatusRequest) returns (TaskStatusResponse);
    // 取消任务
    rpc CancelTask(CancelTaskRequest) returns (CancelTaskResponse);
}

message SortRequest {
    int32 order_id = 1;
    int32 channel_id = 2;
    string trace_code = 3;
}

message SortResponse {
    bool success = 1;
    string message = 2;
    string task_id = 3;
}

// 设备服务
service DeviceService {
    // 获取设备状态
    rpc GetDeviceStatus(Empty) returns (DeviceStatusResponse);
    // 发送PLC指令
    rpc SendPlcCommand(PlcCommandRequest) returns (PlcCommandResponse);
    // 温度数据流
    rpc TemperatureStream(Empty) returns (stream TemperatureData);
}

message TemperatureData {
    int32 channel_id = 1;
    string position = 2;
    double temperature = 3;
    int64 timestamp = 4;
}
```

### 13.2 视觉服务 (Python ↔ Go)

```protobuf
syntax = "proto3";

package vision;

// 视觉识别服务
service VisionService {
    // 识别疫苗
    rpc RecognizeVaccine(RecognizeRequest) returns (RecognizeResponse);
    // 扫描条码
    rpc ScanBarcode(ScanRequest) returns (ScanResponse);
    // 验证疫苗
    rpc VerifyVaccine(VerifyRequest) returns (VerifyResponse);
}

message RecognizeRequest {
    bytes image = 1;
    string expected_vaccine_code = 2;
}

message RecognizeResponse {
    bool success = 1;
    string vaccine_code = 2;
    string trace_code = 3;
    double confidence = 4;
    string image_path = 5;
}

message VerifyRequest {
    bytes image = 1;
    string expected_trace_code = 2;
}

message VerifyResponse {
    bool matched = 1;
    string actual_trace_code = 2;
    double confidence = 3;
}
```

---

> 文档审批：
> - 后端负责人: __________ 日期: __________
> - 前端负责人: __________ 日期: __________

