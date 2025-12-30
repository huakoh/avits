-- ============================================
-- 疫苗自动分拣控制系统 - 数据库初始化脚本
-- ============================================

-- 创建数据库
-- CREATE DATABASE vaccine_db WITH ENCODING 'UTF8';

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 1. 疫苗基础表
-- ============================================
CREATE TABLE IF NOT EXISTS vaccines (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    common_name     VARCHAR(100),
    manufacturer    VARCHAR(100) NOT NULL,
    specification   VARCHAR(50),
    unit            VARCHAR(20) DEFAULT '支',
    storage_temp_min DECIMAL(4,2) DEFAULT 2.00,
    storage_temp_max DECIMAL(4,2) DEFAULT 8.00,
    category        VARCHAR(50),
    inoculation_site VARCHAR(50),
    dose_count      INTEGER DEFAULT 1,
    interval_days   INTEGER[],
    applicable_age  VARCHAR(100),
    status          SMALLINT DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vaccines_code ON vaccines(code);
CREATE INDEX idx_vaccines_name ON vaccines(name);
CREATE INDEX idx_vaccines_status ON vaccines(status);

COMMENT ON TABLE vaccines IS '疫苗基础信息表';

-- ============================================
-- 2. 货道表
-- ============================================
CREATE TABLE IF NOT EXISTS channels (
    id              SERIAL PRIMARY KEY,
    position        VARCHAR(10) NOT NULL UNIQUE,
    row_index       CHAR(1) NOT NULL,
    col_index       INTEGER NOT NULL,
    vaccine_id      INTEGER REFERENCES vaccines(id),
    capacity        INTEGER DEFAULT 20,
    quantity        INTEGER DEFAULT 0,
    status          SMALLINT DEFAULT 1,
    last_outbound   TIMESTAMP,
    sensor_address  VARCHAR(20),
    motor_address   VARCHAR(20),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_channels_position ON channels(position);
CREATE INDEX idx_channels_vaccine ON channels(vaccine_id);
CREATE UNIQUE INDEX idx_channels_row_col ON channels(row_index, col_index);

COMMENT ON TABLE channels IS '货道配置表，6行×10列共60个货道';

-- ============================================
-- 3. 库存表
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id              SERIAL PRIMARY KEY,
    vaccine_id      INTEGER NOT NULL REFERENCES vaccines(id),
    batch_no        VARCHAR(50) NOT NULL,
    trace_code      VARCHAR(30) UNIQUE,
    production_date DATE,
    expiry_date     DATE NOT NULL,
    channel_id      INTEGER REFERENCES channels(id),
    quantity        INTEGER DEFAULT 1,
    status          SMALLINT DEFAULT 1,
    inbound_time    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    outbound_time   TIMESTAMP,
    inbound_temp    DECIMAL(4,2),
    operator_id     INTEGER,
    supplier        VARCHAR(100),
    purchase_order  VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_vaccine ON inventory(vaccine_id);
CREATE INDEX idx_inventory_batch ON inventory(batch_no);
CREATE INDEX idx_inventory_trace ON inventory(trace_code);
CREATE INDEX idx_inventory_expiry ON inventory(expiry_date);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_channel ON inventory(channel_id);

COMMENT ON TABLE inventory IS '库存明细表';

-- ============================================
-- 4. 订单表
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id              SERIAL PRIMARY KEY,
    order_no        VARCHAR(30) NOT NULL UNIQUE,
    his_order_id    VARCHAR(50),
    patient_id      VARCHAR(50),
    patient_name    VARCHAR(50),
    vaccine_id      INTEGER NOT NULL REFERENCES vaccines(id),
    quantity        INTEGER DEFAULT 1,
    dose_number     INTEGER DEFAULT 1,
    priority        SMALLINT DEFAULT 1,
    status          SMALLINT DEFAULT 0,
    error_message   TEXT,
    receive_time    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_time      TIMESTAMP,
    complete_time   TIMESTAMP,
    operator_id     INTEGER,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_his ON orders(his_order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_patient ON orders(patient_id);
CREATE INDEX idx_orders_time ON orders(receive_time);

COMMENT ON TABLE orders IS '接种订单表';

-- ============================================
-- 5. 订单明细表
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    inventory_id    INTEGER NOT NULL REFERENCES inventory(id),
    trace_code      VARCHAR(30) NOT NULL,
    channel_id      INTEGER REFERENCES channels(id),
    batch_no        VARCHAR(50),
    outbound_temp   DECIMAL(4,2),
    vision_verified BOOLEAN DEFAULT FALSE,
    vision_image    VARCHAR(200),
    outbound_time   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_trace ON order_items(trace_code);

COMMENT ON TABLE order_items IS '订单明细表';

-- ============================================
-- 6. 追溯记录表
-- ============================================
CREATE TABLE IF NOT EXISTS traces (
    id              SERIAL PRIMARY KEY,
    trace_code      VARCHAR(30) NOT NULL,
    inventory_id    INTEGER REFERENCES inventory(id),
    operation       VARCHAR(20) NOT NULL,
    operation_name  VARCHAR(50),
    from_location   VARCHAR(50),
    to_location     VARCHAR(50),
    temperature     DECIMAL(4,2),
    operator_id     INTEGER,
    operator_name   VARCHAR(50),
    remark          TEXT,
    extra_data      JSONB,
    operated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_traces_code ON traces(trace_code);
CREATE INDEX idx_traces_inventory ON traces(inventory_id);
CREATE INDEX idx_traces_operation ON traces(operation);
CREATE INDEX idx_traces_time ON traces(operated_at);

COMMENT ON TABLE traces IS '疫苗追溯记录表';

-- ============================================
-- 7. 报警记录表
-- ============================================
CREATE TABLE IF NOT EXISTS alarms (
    id              SERIAL PRIMARY KEY,
    alarm_code      VARCHAR(20) NOT NULL,
    alarm_type      VARCHAR(50) NOT NULL,
    level           SMALLINT NOT NULL,
    source          VARCHAR(50),
    source_id       INTEGER,
    message         TEXT NOT NULL,
    detail          JSONB,
    status          SMALLINT DEFAULT 0,
    handled_by      INTEGER,
    handled_at      TIMESTAMP,
    handle_result   TEXT,
    notified        BOOLEAN DEFAULT FALSE,
    notify_time     TIMESTAMP,
    alarm_time      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alarms_type ON alarms(alarm_type);
CREATE INDEX idx_alarms_level ON alarms(level);
CREATE INDEX idx_alarms_status ON alarms(status);
CREATE INDEX idx_alarms_time ON alarms(alarm_time);

COMMENT ON TABLE alarms IS '报警记录表';

-- ============================================
-- 8. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(100) NOT NULL,
    real_name       VARCHAR(50),
    phone           VARCHAR(20),
    email           VARCHAR(100),
    department      VARCHAR(50),
    position        VARCHAR(50),
    avatar          VARCHAR(200),
    status          SMALLINT DEFAULT 1,
    last_login      TIMESTAMP,
    last_login_ip   VARCHAR(50),
    login_count     INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone);

COMMENT ON TABLE users IS '用户表';

-- ============================================
-- 9. 角色表
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,
    code            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    is_system       BOOLEAN DEFAULT FALSE,
    status          SMALLINT DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. 权限表
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(100) NOT NULL UNIQUE,
    resource        VARCHAR(50),
    action          VARCHAR(50),
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. 角色权限关联表
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id         INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================
-- 12. 用户角色关联表
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ============================================
-- 13. 审计日志表
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INTEGER,
    username        VARCHAR(50),
    action          VARCHAR(50) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     VARCHAR(50),
    description     TEXT,
    request_path    VARCHAR(200),
    request_method  VARCHAR(10),
    request_body    JSONB,
    response_code   INTEGER,
    ip_address      VARCHAR(50),
    user_agent      VARCHAR(500),
    duration_ms     INTEGER,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_time ON audit_logs(created_at);

COMMENT ON TABLE audit_logs IS '审计日志表';

-- ============================================
-- 14. 设备表
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,
    code            VARCHAR(50) NOT NULL UNIQUE,
    type            VARCHAR(50) NOT NULL,
    model           VARCHAR(50),
    ip_address      VARCHAR(50),
    port            INTEGER,
    protocol        VARCHAR(20),
    status          SMALLINT DEFAULT 0,
    last_heartbeat  TIMESTAMP,
    config          JSONB,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_devices_type ON devices(type);
CREATE INDEX idx_devices_status ON devices(status);

COMMENT ON TABLE devices IS '设备表';

-- ============================================
-- 初始化数据
-- ============================================

-- 初始化角色
INSERT INTO roles (name, code, description, is_system) VALUES
('超级管理员', 'SUPER_ADMIN', '拥有所有权限', TRUE),
('系统管理员', 'ADMIN', '系统管理权限', TRUE),
('操作员', 'OPERATOR', '日常操作权限', FALSE),
('查看员', 'VIEWER', '只读查看权限', FALSE)
ON CONFLICT (code) DO NOTHING;

-- 初始化权限
INSERT INTO permissions (name, code, resource, action) VALUES
('查看疫苗', 'vaccine:view', 'vaccine', 'view'),
('新增疫苗', 'vaccine:create', 'vaccine', 'create'),
('编辑疫苗', 'vaccine:update', 'vaccine', 'update'),
('删除疫苗', 'vaccine:delete', 'vaccine', 'delete'),
('查看库存', 'inventory:view', 'inventory', 'view'),
('入库操作', 'inventory:inbound', 'inventory', 'inbound'),
('出库操作', 'inventory:outbound', 'inventory', 'outbound'),
('查看订单', 'order:view', 'order', 'view'),
('处理订单', 'order:process', 'order', 'process'),
('查看设备', 'device:view', 'device', 'view'),
('控制设备', 'device:control', 'device', 'control'),
('查看报警', 'alarm:view', 'alarm', 'view'),
('处理报警', 'alarm:handle', 'alarm', 'handle'),
('用户管理', 'user:manage', 'user', 'manage'),
('系统配置', 'system:config', 'system', 'config')
ON CONFLICT (code) DO NOTHING;

-- 初始化管理员账号 (密码: admin123)
INSERT INTO users (username, password_hash, real_name, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EHs', '系统管理员', 1)
ON CONFLICT (username) DO NOTHING;

-- 关联管理员角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'admin' AND r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- 初始化60个货道
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
    generate_series(1, 10) AS col_num
ON CONFLICT (position) DO NOTHING;

-- 初始化设备
INSERT INTO devices (name, code, type, model, ip_address, port, protocol, status) VALUES
('主PLC', 'PLC_MAIN', 'PLC', 'XC3-60RT', '192.168.1.100', 502, 'MODBUS_TCP', 0),
('备PLC', 'PLC_BACKUP', 'PLC', 'XC3-60RT', '192.168.1.101', 502, 'MODBUS_TCP', 0),
('工业相机', 'CAMERA_MAIN', 'CAMERA', 'MV-CE060', '192.168.1.200', 80, 'HTTP', 0),
('条码扫描器', 'SCANNER_MAIN', 'SCANNER', '1950g', NULL, NULL, 'USB', 0)
ON CONFLICT (code) DO NOTHING;

-- 完成
SELECT '数据库初始化完成' AS message;

