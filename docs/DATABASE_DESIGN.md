# 数据库设计文档

> 文档版本: v1.0.0  
> 更新日期: 2024-12-29

---

## 1. 数据库选型

| 数据库 | 用途 | 版本 |
|--------|------|------|
| PostgreSQL | 业务数据主库 | 15+ |
| TimescaleDB | 时序数据（温度、日志） | 2.x |
| Redis | 缓存、会话、消息队列 | 7+ |

---

## 2. ER图

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    实体关系图 (ER)                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐                        │
│  │   vaccines   │         │   channels   │         │ temperature  │                        │
│  │   (疫苗表)   │         │   (货道表)   │         │   _records   │                        │
│  ├──────────────┤         ├──────────────┤         │  (温度记录)  │                        │
│  │ id           │ 1     N │ id           │         ├──────────────┤                        │
│  │ code         │◄────────┤ vaccine_id   │ 1     N │ id           │                        │
│  │ name         │         │ position     │◄────────┤ channel_id   │                        │
│  │ manufacturer │         │ quantity     │         │ temperature  │                        │
│  │ spec         │         │ status       │         │ recorded_at  │                        │
│  └──────┬───────┘         └──────────────┘         └──────────────┘                        │
│         │                                                                                   │
│         │ 1                                                                                 │
│         │                                                                                   │
│         │ N                                                                                 │
│  ┌──────┴───────┐         ┌──────────────┐         ┌──────────────┐                        │
│  │  inventory   │         │   orders     │         │order_items   │                        │
│  │  (库存表)    │         │  (订单表)    │         │ (订单明细)   │                        │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤                        │
│  │ id           │         │ id           │ 1     N │ id           │                        │
│  │ vaccine_id   │◄────────┤ order_no     │◄────────┤ order_id     │                        │
│  │ batch_no     │         │ patient_id   │         │ vaccine_id   │                        │
│  │ quantity     │         │ status       │         │ trace_code   │                        │
│  │ expiry_date  │         │ created_at   │         │ channel_id   │                        │
│  └──────┬───────┘         └──────────────┘         └──────────────┘                        │
│         │                                                                                   │
│         │ 1                                                                                 │
│         │                                                                                   │
│         │ N                                                                                 │
│  ┌──────┴───────┐         ┌──────────────┐         ┌──────────────┐                        │
│  │   traces     │         │    users     │         │    roles     │                        │
│  │  (追溯表)    │         │  (用户表)    │         │  (角色表)    │                        │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤                        │
│  │ id           │         │ id           │ N     N │ id           │                        │
│  │ trace_code   │         │ username     │◄───────►│ name         │                        │
│  │ inventory_id │         │ password     │         │ permissions  │                        │
│  │ operation    │         │ role_id      │         │              │                        │
│  │ operated_at  │         │ status       │         │              │                        │
│  └──────────────┘         └──────────────┘         └──────────────┘                        │
│                                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐                        │
│  │   alarms     │         │ audit_logs   │         │   devices    │                        │
│  │  (报警表)    │         │ (审计日志)   │         │  (设备表)    │                        │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤                        │
│  │ id           │         │ id           │         │ id           │                        │
│  │ type         │         │ user_id      │         │ name         │                        │
│  │ level        │         │ action       │         │ type         │                        │
│  │ message      │         │ resource     │         │ status       │                        │
│  │ handled      │         │ ip_address   │         │ last_heartbeat│                       │
│  └──────────────┘         └──────────────┘         └──────────────┘                        │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 表结构设计

### 3.1 疫苗基础表 (vaccines)

```sql
-- 疫苗基础信息表
CREATE TABLE vaccines (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,        -- 疫苗编码
    name            VARCHAR(100) NOT NULL,              -- 疫苗名称
    common_name     VARCHAR(100),                       -- 通用名称
    manufacturer    VARCHAR(100) NOT NULL,              -- 生产厂家
    specification   VARCHAR(50),                        -- 规格 (如: 0.5ml/支)
    unit            VARCHAR(20) DEFAULT '支',           -- 单位
    storage_temp_min DECIMAL(4,2) DEFAULT 2.00,         -- 存储温度下限
    storage_temp_max DECIMAL(4,2) DEFAULT 8.00,         -- 存储温度上限
    category        VARCHAR(50),                        -- 疫苗类别 (一类/二类)
    inoculation_site VARCHAR(50),                       -- 接种部位
    dose_count      INTEGER DEFAULT 1,                  -- 剂次数
    interval_days   INTEGER[],                          -- 接种间隔(天)
    applicable_age  VARCHAR(100),                       -- 适用年龄
    status          SMALLINT DEFAULT 1,                 -- 状态: 1启用 0停用
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_vaccines_code ON vaccines(code);
CREATE INDEX idx_vaccines_name ON vaccines(name);

-- 注释
COMMENT ON TABLE vaccines IS '疫苗基础信息表';
COMMENT ON COLUMN vaccines.code IS '疫苗唯一编码';
COMMENT ON COLUMN vaccines.storage_temp_min IS 'GSP要求的最低存储温度';
```

### 3.2 货道表 (channels)

```sql
-- 货道信息表
CREATE TABLE channels (
    id              SERIAL PRIMARY KEY,
    position        VARCHAR(10) NOT NULL UNIQUE,        -- 货道位置 (如: A1, B5)
    row_index       CHAR(1) NOT NULL,                   -- 行号 (A-F)
    col_index       INTEGER NOT NULL,                   -- 列号 (1-10)
    vaccine_id      INTEGER REFERENCES vaccines(id),    -- 当前存储的疫苗
    capacity        INTEGER DEFAULT 20,                 -- 容量
    quantity        INTEGER DEFAULT 0,                  -- 当前数量
    status          SMALLINT DEFAULT 1,                 -- 状态: 1正常 2故障 0停用
    last_outbound   TIMESTAMP,                          -- 最后出库时间
    sensor_address  VARCHAR(20),                        -- 传感器地址
    motor_address   VARCHAR(20),                        -- 电机地址
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_channels_position ON channels(position);
CREATE INDEX idx_channels_vaccine ON channels(vaccine_id);
CREATE UNIQUE INDEX idx_channels_row_col ON channels(row_index, col_index);

-- 注释
COMMENT ON TABLE channels IS '货道配置表，6行×10列共60个货道';
COMMENT ON COLUMN channels.position IS '货道坐标，如A1表示第A行第1列';
```

### 3.3 库存表 (inventory)

```sql
-- 库存明细表
CREATE TABLE inventory (
    id              SERIAL PRIMARY KEY,
    vaccine_id      INTEGER NOT NULL REFERENCES vaccines(id),
    batch_no        VARCHAR(50) NOT NULL,               -- 批次号
    trace_code      VARCHAR(30) UNIQUE,                 -- 溯源码 (20位)
    production_date DATE,                               -- 生产日期
    expiry_date     DATE NOT NULL,                      -- 有效期至
    channel_id      INTEGER REFERENCES channels(id),    -- 所在货道
    quantity        INTEGER DEFAULT 1,                  -- 数量
    status          SMALLINT DEFAULT 1,                 -- 状态: 1在库 2已出库 3已报废
    inbound_time    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,-- 入库时间
    outbound_time   TIMESTAMP,                          -- 出库时间
    inbound_temp    DECIMAL(4,2),                       -- 入库温度
    operator_id     INTEGER,                            -- 操作员
    supplier        VARCHAR(100),                       -- 供应商
    purchase_order  VARCHAR(50),                        -- 采购单号
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_inventory_vaccine ON inventory(vaccine_id);
CREATE INDEX idx_inventory_batch ON inventory(batch_no);
CREATE INDEX idx_inventory_trace ON inventory(trace_code);
CREATE INDEX idx_inventory_expiry ON inventory(expiry_date);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_channel ON inventory(channel_id);

-- 分区表 (按月分区，便于归档)
-- 实际使用时可根据数据量决定是否分区
```

### 3.4 订单表 (orders)

```sql
-- 接种订单表
CREATE TABLE orders (
    id              SERIAL PRIMARY KEY,
    order_no        VARCHAR(30) NOT NULL UNIQUE,        -- 订单号
    his_order_id    VARCHAR(50),                        -- HIS系统订单ID
    patient_id      VARCHAR(50),                        -- 患者ID
    patient_name    VARCHAR(50),                        -- 患者姓名 (脱敏存储)
    vaccine_id      INTEGER NOT NULL REFERENCES vaccines(id),
    quantity        INTEGER DEFAULT 1,                  -- 数量
    dose_number     INTEGER DEFAULT 1,                  -- 第几剂
    priority        SMALLINT DEFAULT 1,                 -- 优先级: 1普通 2加急
    status          SMALLINT DEFAULT 0,                 -- 状态: 0待处理 1处理中 2已完成 3已取消 4异常
    error_message   TEXT,                               -- 异常信息
    receive_time    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,-- 接收时间
    start_time      TIMESTAMP,                          -- 开始处理时间
    complete_time   TIMESTAMP,                          -- 完成时间
    operator_id     INTEGER,                            -- 操作员
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_his ON orders(his_order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_patient ON orders(patient_id);
CREATE INDEX idx_orders_time ON orders(receive_time);
```

### 3.5 订单明细表 (order_items)

```sql
-- 订单明细表 (出库的具体疫苗)
CREATE TABLE order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    inventory_id    INTEGER NOT NULL REFERENCES inventory(id),
    trace_code      VARCHAR(30) NOT NULL,               -- 溯源码
    channel_id      INTEGER REFERENCES channels(id),    -- 出库货道
    batch_no        VARCHAR(50),                        -- 批次号
    outbound_temp   DECIMAL(4,2),                       -- 出库时温度
    vision_verified BOOLEAN DEFAULT FALSE,              -- 视觉验证通过
    vision_image    VARCHAR(200),                       -- 视觉验证图片路径
    outbound_time   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_trace ON order_items(trace_code);
CREATE INDEX idx_order_items_inventory ON order_items(inventory_id);
```

### 3.6 追溯记录表 (traces)

```sql
-- 疫苗追溯记录表
CREATE TABLE traces (
    id              SERIAL PRIMARY KEY,
    trace_code      VARCHAR(30) NOT NULL,               -- 溯源码
    inventory_id    INTEGER REFERENCES inventory(id),
    operation       VARCHAR(20) NOT NULL,               -- 操作类型: INBOUND/OUTBOUND/TRANSFER/SCRAP
    operation_name  VARCHAR(50),                        -- 操作名称
    from_location   VARCHAR(50),                        -- 来源位置
    to_location     VARCHAR(50),                        -- 目标位置
    temperature     DECIMAL(4,2),                       -- 当时温度
    operator_id     INTEGER,                            -- 操作员
    operator_name   VARCHAR(50),                        -- 操作员姓名
    remark          TEXT,                               -- 备注
    extra_data      JSONB,                              -- 扩展数据
    operated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_traces_code ON traces(trace_code);
CREATE INDEX idx_traces_inventory ON traces(inventory_id);
CREATE INDEX idx_traces_operation ON traces(operation);
CREATE INDEX idx_traces_time ON traces(operated_at);
```

### 3.7 温度记录表 (temperature_records) - TimescaleDB

```sql
-- 温度采集记录表 (时序数据)
CREATE TABLE temperature_records (
    time            TIMESTAMPTZ NOT NULL,
    channel_id      INTEGER NOT NULL,                   -- 货道ID
    position        VARCHAR(10),                        -- 货道位置
    temperature     DECIMAL(5,2) NOT NULL,              -- 温度值
    humidity        DECIMAL(5,2),                       -- 湿度值 (可选)
    sensor_id       VARCHAR(20),                        -- 传感器ID
    is_alarm        BOOLEAN DEFAULT FALSE,              -- 是否报警
    alarm_type      SMALLINT                            -- 报警类型: 1超上限 2超下限
);

-- 创建 TimescaleDB 超表
SELECT create_hypertable('temperature_records', 'time');

-- 创建索引
CREATE INDEX idx_temp_channel ON temperature_records(channel_id, time DESC);
CREATE INDEX idx_temp_alarm ON temperature_records(is_alarm, time DESC) WHERE is_alarm = TRUE;

-- 设置数据保留策略 (保留5年)
SELECT add_retention_policy('temperature_records', INTERVAL '5 years');

-- 设置压缩策略 (30天后压缩)
ALTER TABLE temperature_records SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'channel_id'
);
SELECT add_compression_policy('temperature_records', INTERVAL '30 days');

-- 创建连续聚合视图 (每小时平均温度)
CREATE MATERIALIZED VIEW temperature_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    channel_id,
    AVG(temperature) AS avg_temp,
    MIN(temperature) AS min_temp,
    MAX(temperature) AS max_temp,
    COUNT(*) AS sample_count
FROM temperature_records
GROUP BY bucket, channel_id
WITH NO DATA;

-- 刷新策略
SELECT add_continuous_aggregate_policy('temperature_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);
```

### 3.8 报警记录表 (alarms)

```sql
-- 报警记录表
CREATE TABLE alarms (
    id              SERIAL PRIMARY KEY,
    alarm_code      VARCHAR(20) NOT NULL,               -- 报警代码
    alarm_type      VARCHAR(50) NOT NULL,               -- 报警类型
    level           SMALLINT NOT NULL,                  -- 级别: 1提示 2警告 3严重 4紧急
    source          VARCHAR(50),                        -- 报警来源
    source_id       INTEGER,                            -- 来源ID
    message         TEXT NOT NULL,                      -- 报警信息
    detail          JSONB,                              -- 详细数据
    status          SMALLINT DEFAULT 0,                 -- 状态: 0未处理 1处理中 2已处理 3已忽略
    handled_by      INTEGER,                            -- 处理人
    handled_at      TIMESTAMP,                          -- 处理时间
    handle_result   TEXT,                               -- 处理结果
    notified        BOOLEAN DEFAULT FALSE,              -- 是否已通知
    notify_time     TIMESTAMP,                          -- 通知时间
    alarm_time      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_alarms_type ON alarms(alarm_type);
CREATE INDEX idx_alarms_level ON alarms(level);
CREATE INDEX idx_alarms_status ON alarms(status);
CREATE INDEX idx_alarms_time ON alarms(alarm_time);

-- 报警类型枚举
COMMENT ON COLUMN alarms.alarm_type IS '报警类型: TEMP_HIGH/TEMP_LOW/DEVICE_FAULT/STOCK_LOW/EXPIRY_WARN/SORT_ERROR';
```

### 3.9 用户表 (users)

```sql
-- 用户表
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,        -- 用户名
    password_hash   VARCHAR(100) NOT NULL,              -- 密码哈希
    real_name       VARCHAR(50),                        -- 真实姓名
    phone           VARCHAR(20),                        -- 手机号
    email           VARCHAR(100),                       -- 邮箱
    department      VARCHAR(50),                        -- 部门
    position        VARCHAR(50),                        -- 职位
    avatar          VARCHAR(200),                       -- 头像URL
    status          SMALLINT DEFAULT 1,                 -- 状态: 1正常 0禁用
    last_login      TIMESTAMP,                          -- 最后登录时间
    last_login_ip   VARCHAR(50),                        -- 最后登录IP
    login_count     INTEGER DEFAULT 0,                  -- 登录次数
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone);
```

### 3.10 角色权限表 (roles & permissions)

```sql
-- 角色表
CREATE TABLE roles (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,        -- 角色名称
    code            VARCHAR(50) NOT NULL UNIQUE,        -- 角色代码
    description     TEXT,                               -- 描述
    is_system       BOOLEAN DEFAULT FALSE,              -- 是否系统角色
    status          SMALLINT DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限表
CREATE TABLE permissions (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,              -- 权限名称
    code            VARCHAR(100) NOT NULL UNIQUE,       -- 权限代码
    resource        VARCHAR(50),                        -- 资源类型
    action          VARCHAR(50),                        -- 操作类型
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色权限关联表
CREATE TABLE role_permissions (
    role_id         INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 用户角色关联表
CREATE TABLE user_roles (
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
```

### 3.11 审计日志表 (audit_logs)

```sql
-- 审计日志表
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INTEGER,                            -- 用户ID
    username        VARCHAR(50),                        -- 用户名
    action          VARCHAR(50) NOT NULL,               -- 操作类型
    resource_type   VARCHAR(50),                        -- 资源类型
    resource_id     VARCHAR(50),                        -- 资源ID
    description     TEXT,                               -- 操作描述
    request_path    VARCHAR(200),                       -- 请求路径
    request_method  VARCHAR(10),                        -- 请求方法
    request_body    JSONB,                              -- 请求体
    response_code   INTEGER,                            -- 响应码
    ip_address      VARCHAR(50),                        -- IP地址
    user_agent      VARCHAR(500),                       -- User Agent
    duration_ms     INTEGER,                            -- 耗时(毫秒)
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_time ON audit_logs(created_at);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- 分区 (按月)
-- 生产环境建议使用分区表
```

### 3.12 设备状态表 (devices)

```sql
-- 设备表
CREATE TABLE devices (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,               -- 设备名称
    code            VARCHAR(50) NOT NULL UNIQUE,        -- 设备编码
    type            VARCHAR(50) NOT NULL,               -- 设备类型
    model           VARCHAR(50),                        -- 设备型号
    ip_address      VARCHAR(50),                        -- IP地址
    port            INTEGER,                            -- 端口
    protocol        VARCHAR(20),                        -- 通信协议
    status          SMALLINT DEFAULT 0,                 -- 状态: 0离线 1在线 2故障
    last_heartbeat  TIMESTAMP,                          -- 最后心跳时间
    config          JSONB,                              -- 配置参数
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_devices_type ON devices(type);
CREATE INDEX idx_devices_status ON devices(status);
```

---

## 4. 初始化数据

### 4.1 系统角色

```sql
-- 初始化角色
INSERT INTO roles (name, code, description, is_system) VALUES
('超级管理员', 'SUPER_ADMIN', '拥有所有权限', TRUE),
('系统管理员', 'ADMIN', '系统管理权限', TRUE),
('操作员', 'OPERATOR', '日常操作权限', FALSE),
('查看员', 'VIEWER', '只读查看权限', FALSE);

-- 初始化权限
INSERT INTO permissions (name, code, resource, action) VALUES
-- 疫苗管理
('查看疫苗', 'vaccine:view', 'vaccine', 'view'),
('新增疫苗', 'vaccine:create', 'vaccine', 'create'),
('编辑疫苗', 'vaccine:update', 'vaccine', 'update'),
('删除疫苗', 'vaccine:delete', 'vaccine', 'delete'),
-- 库存管理
('查看库存', 'inventory:view', 'inventory', 'view'),
('入库操作', 'inventory:inbound', 'inventory', 'inbound'),
('出库操作', 'inventory:outbound', 'inventory', 'outbound'),
-- 订单管理
('查看订单', 'order:view', 'order', 'view'),
('处理订单', 'order:process', 'order', 'process'),
-- 设备管理
('查看设备', 'device:view', 'device', 'view'),
('控制设备', 'device:control', 'device', 'control'),
-- 报警管理
('查看报警', 'alarm:view', 'alarm', 'view'),
('处理报警', 'alarm:handle', 'alarm', 'handle'),
-- 系统管理
('用户管理', 'user:manage', 'user', 'manage'),
('系统配置', 'system:config', 'system', 'config');
```

### 4.2 货道初始化

```sql
-- 初始化60个货道 (6行×10列)
INSERT INTO channels (position, row_index, col_index, capacity, sensor_address, motor_address)
SELECT 
    row_letter || col_num::text,
    row_letter,
    col_num,
    20,
    'AD' || ((row_num - 1) * 2)::text,
    'Y' || ((row_num - 1) * 10 + col_num - 1)::text
FROM 
    (SELECT unnest(ARRAY['A','B','C','D','E','F']) AS row_letter, 
            generate_series(1, 6) AS row_num) AS rows,
    generate_series(1, 10) AS col_num;
```

### 4.3 报警类型定义

```sql
-- 报警代码定义
CREATE TABLE alarm_definitions (
    code            VARCHAR(20) PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,
    level           SMALLINT NOT NULL,
    description     TEXT,
    handle_guide    TEXT                                -- 处理指南
);

INSERT INTO alarm_definitions (code, name, level, description, handle_guide) VALUES
('TEMP_HIGH', '温度超上限', 4, '货道温度超过8℃', '立即检查制冷设备，确认疫苗状态'),
('TEMP_LOW', '温度超下限', 4, '货道温度低于2℃', '检查制冷设备设置，防止疫苗冻结'),
('TEMP_WARN_HIGH', '温度预警高', 2, '货道温度接近上限(>7.5℃)', '关注温度变化，检查制冷设备'),
('TEMP_WARN_LOW', '温度预警低', 2, '货道温度接近下限(<2.5℃)', '关注温度变化，调整制冷设备'),
('DEVICE_OFFLINE', '设备离线', 3, 'PLC或传感器通信中断', '检查网络连接和设备状态'),
('DEVICE_FAULT', '设备故障', 3, '设备运行异常', '检查设备并联系维护人员'),
('STOCK_LOW', '库存不足', 2, '疫苗库存低于安全阈值', '及时补充库存'),
('EXPIRY_WARN', '近效期预警', 2, '疫苗即将过期(≤30天)', '优先使用或安排退货'),
('SORT_ERROR', '分拣异常', 3, '分拣过程出现错误', '检查货道和皮带线状态'),
('VISION_FAIL', '视觉识别失败', 2, '无法识别疫苗信息', '检查相机和光源，人工确认');
```

---

## 5. 常用查询

### 5.1 库存查询

```sql
-- 按疫苗类型查询库存汇总
SELECT 
    v.code,
    v.name,
    v.manufacturer,
    COUNT(*) AS total_count,
    SUM(CASE WHEN i.status = 1 THEN 1 ELSE 0 END) AS in_stock,
    MIN(i.expiry_date) AS nearest_expiry,
    STRING_AGG(DISTINCT i.batch_no, ', ') AS batch_nos
FROM inventory i
JOIN vaccines v ON i.vaccine_id = v.id
WHERE i.status = 1
GROUP BY v.id, v.code, v.name, v.manufacturer
ORDER BY v.name;

-- 查询近效期疫苗 (30天内)
SELECT 
    i.*,
    v.name AS vaccine_name,
    c.position AS channel_position,
    i.expiry_date - CURRENT_DATE AS days_to_expiry
FROM inventory i
JOIN vaccines v ON i.vaccine_id = v.id
LEFT JOIN channels c ON i.channel_id = c.id
WHERE i.status = 1 
  AND i.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY i.expiry_date;
```

### 5.2 温度查询

```sql
-- 查询最近1小时温度趋势
SELECT 
    time_bucket('5 minutes', time) AS bucket,
    channel_id,
    AVG(temperature) AS avg_temp,
    MIN(temperature) AS min_temp,
    MAX(temperature) AS max_temp
FROM temperature_records
WHERE time > NOW() - INTERVAL '1 hour'
GROUP BY bucket, channel_id
ORDER BY bucket DESC;

-- 查询温度异常记录
SELECT 
    tr.*,
    c.position AS channel_position
FROM temperature_records tr
JOIN channels c ON tr.channel_id = c.id
WHERE tr.is_alarm = TRUE
  AND tr.time > NOW() - INTERVAL '24 hours'
ORDER BY tr.time DESC;
```

### 5.3 追溯查询

```sql
-- 根据溯源码查询完整追溯链
SELECT 
    t.operation,
    t.operation_name,
    t.from_location,
    t.to_location,
    t.temperature,
    t.operator_name,
    t.remark,
    t.operated_at
FROM traces t
WHERE t.trace_code = '20241229001234567890'
ORDER BY t.operated_at;

-- 批次追溯查询
SELECT 
    i.trace_code,
    i.batch_no,
    v.name AS vaccine_name,
    i.status,
    i.inbound_time,
    i.outbound_time,
    o.patient_id,
    o.order_no
FROM inventory i
JOIN vaccines v ON i.vaccine_id = v.id
LEFT JOIN order_items oi ON i.id = oi.inventory_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE i.batch_no = 'B20241201'
ORDER BY i.inbound_time;
```

---

## 6. 索引策略

### 6.1 索引设计原则

1. **主键索引**: 所有表都有自增主键
2. **业务唯一索引**: 溯源码、订单号等业务唯一字段
3. **外键索引**: 所有外键字段建立索引
4. **查询条件索引**: 高频查询条件字段
5. **组合索引**: 多条件联合查询优化

### 6.2 关键索引清单

| 表名 | 索引名 | 字段 | 类型 |
|------|--------|------|------|
| inventory | idx_inventory_trace | trace_code | UNIQUE |
| inventory | idx_inventory_status_expiry | status, expiry_date | BTREE |
| orders | idx_orders_status_time | status, receive_time | BTREE |
| temperature_records | idx_temp_channel_time | channel_id, time DESC | BTREE |
| traces | idx_traces_code_time | trace_code, operated_at | BTREE |

---

## 7. 数据备份策略

### 7.1 备份计划

| 备份类型 | 频率 | 保留期限 | 存储位置 |
|----------|------|----------|----------|
| 全量备份 | 每日 | 30天 | 本地+远程 |
| 增量备份 | 每小时 | 7天 | 本地 |
| WAL归档 | 实时 | 7天 | 本地+远程 |
| 冷数据归档 | 每月 | 5年 | 对象存储 |

### 7.2 备份脚本

```bash
#!/bin/bash
# 每日全量备份脚本

DATE=$(date +%Y%m%d)
BACKUP_DIR=/backup/postgresql
REMOTE_DIR=s3://backup-bucket/postgresql

# 执行备份
pg_dump -h localhost -U postgres -Fc vaccine_db > ${BACKUP_DIR}/vaccine_db_${DATE}.dump

# 上传到远程存储
aws s3 cp ${BACKUP_DIR}/vaccine_db_${DATE}.dump ${REMOTE_DIR}/

# 清理30天前的本地备份
find ${BACKUP_DIR} -name "*.dump" -mtime +30 -delete
```

---

> 文档审批：
> - DBA: __________ 日期: __________
> - 架构师: __________ 日期: __________

