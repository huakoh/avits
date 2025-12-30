package model

import (
	"time"

	"gorm.io/gorm"
)

// Vaccine 疫苗信息
type Vaccine struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Code           string         `gorm:"uniqueIndex;size:50;not null" json:"code"`
	Name           string         `gorm:"size:100;not null" json:"name"`
	CommonName     string         `gorm:"size:100" json:"common_name"`
	Manufacturer   string         `gorm:"size:100;not null" json:"manufacturer"`
	Specification  string         `gorm:"size:50" json:"specification"`
	Unit           string         `gorm:"size:20;default:支" json:"unit"`
	StorageTempMin float64        `gorm:"default:2.00" json:"storage_temp_min"`
	StorageTempMax float64        `gorm:"default:8.00" json:"storage_temp_max"`
	Category       string         `gorm:"size:50" json:"category"`
	DoseCount      int            `gorm:"default:1" json:"dose_count"`
	ApplicableAge  string         `gorm:"size:100" json:"applicable_age"`
	Status         int8           `gorm:"default:1" json:"status"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

// Channel 货道信息
type Channel struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Position     string    `gorm:"uniqueIndex;size:10;not null" json:"position"`
	RowIndex     string    `gorm:"size:1;not null" json:"row_index"`
	ColIndex     int       `gorm:"not null" json:"col_index"`
	VaccineID    *uint     `json:"vaccine_id"`
	Vaccine      *Vaccine  `gorm:"foreignKey:VaccineID" json:"vaccine,omitempty"`
	Capacity     int       `gorm:"default:20" json:"capacity"`
	Quantity     int       `gorm:"default:0" json:"quantity"`
	Status       int8      `gorm:"default:1" json:"status"` // 1正常 2故障 0停用
	LastOutbound *time.Time `json:"last_outbound"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Inventory 库存
type Inventory struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	VaccineID      uint           `gorm:"not null" json:"vaccine_id"`
	Vaccine        Vaccine        `gorm:"foreignKey:VaccineID" json:"vaccine,omitempty"`
	BatchNo        string         `gorm:"size:50;not null" json:"batch_no"`
	TraceCode      string         `gorm:"uniqueIndex;size:30" json:"trace_code"`
	ProductionDate *time.Time     `json:"production_date"`
	ExpiryDate     time.Time      `gorm:"not null" json:"expiry_date"`
	ChannelID      *uint          `json:"channel_id"`
	Channel        *Channel       `gorm:"foreignKey:ChannelID" json:"channel,omitempty"`
	Quantity       int            `gorm:"default:1" json:"quantity"`
	Status         int8           `gorm:"default:1" json:"status"` // 1在库 2已出库 3已报废
	InboundTime    time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"inbound_time"`
	OutboundTime   *time.Time     `json:"outbound_time"`
	InboundTemp    *float64       `json:"inbound_temp"`
	OperatorID     *uint          `json:"operator_id"`
	Supplier       string         `gorm:"size:100" json:"supplier"`
	PurchaseOrder  string         `gorm:"size:50" json:"purchase_order"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

// Order 订单
type Order struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	OrderNo      string         `gorm:"uniqueIndex;size:30;not null" json:"order_no"`
	HISOrderID   string         `gorm:"size:50" json:"his_order_id"`
	PatientID    string         `gorm:"size:50" json:"patient_id"`
	PatientName  string         `gorm:"size:50" json:"patient_name"`
	VaccineID    uint           `gorm:"not null" json:"vaccine_id"`
	Vaccine      Vaccine        `gorm:"foreignKey:VaccineID" json:"vaccine,omitempty"`
	Quantity     int            `gorm:"default:1" json:"quantity"`
	DoseNumber   int            `gorm:"default:1" json:"dose_number"`
	Priority     int8           `gorm:"default:1" json:"priority"` // 1普通 2加急
	Status       int8           `gorm:"default:0" json:"status"`   // 0待处理 1处理中 2已完成 3已取消 4异常
	ErrorMessage string         `gorm:"type:text" json:"error_message"`
	ReceiveTime  time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"receive_time"`
	StartTime    *time.Time     `json:"start_time"`
	CompleteTime *time.Time     `json:"complete_time"`
	OperatorID   *uint          `json:"operator_id"`
	Items        []OrderItem    `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// OrderItem 订单明细
type OrderItem struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	OrderID        uint      `gorm:"not null" json:"order_id"`
	InventoryID    uint      `gorm:"not null" json:"inventory_id"`
	Inventory      Inventory `gorm:"foreignKey:InventoryID" json:"inventory,omitempty"`
	TraceCode      string    `gorm:"size:30;not null" json:"trace_code"`
	ChannelID      *uint     `json:"channel_id"`
	BatchNo        string    `gorm:"size:50" json:"batch_no"`
	OutboundTemp   *float64  `json:"outbound_temp"`
	VisionVerified bool      `gorm:"default:false" json:"vision_verified"`
	VisionImage    string    `gorm:"size:200" json:"vision_image"`
	OutboundTime   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"outbound_time"`
	CreatedAt      time.Time `json:"created_at"`
}

// Trace 追溯记录
type Trace struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	TraceCode     string    `gorm:"index;size:30;not null" json:"trace_code"`
	InventoryID   *uint     `json:"inventory_id"`
	Operation     string    `gorm:"size:20;not null" json:"operation"` // INBOUND/OUTBOUND/TRANSFER/SCRAP
	OperationName string    `gorm:"size:50" json:"operation_name"`
	FromLocation  string    `gorm:"size:50" json:"from_location"`
	ToLocation    string    `gorm:"size:50" json:"to_location"`
	Temperature   *float64  `json:"temperature"`
	OperatorID    *uint     `json:"operator_id"`
	OperatorName  string    `gorm:"size:50" json:"operator_name"`
	Remark        string    `gorm:"type:text" json:"remark"`
	OperatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"operated_at"`
	CreatedAt     time.Time `json:"created_at"`
}

// Alarm 报警记录
type Alarm struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	AlarmCode    string     `gorm:"size:20;not null" json:"alarm_code"`
	AlarmType    string     `gorm:"size:50;not null" json:"alarm_type"`
	Level        int8       `gorm:"not null" json:"level"` // 1提示 2警告 3严重 4紧急
	Source       string     `gorm:"size:50" json:"source"`
	SourceID     *uint      `json:"source_id"`
	Message      string     `gorm:"type:text;not null" json:"message"`
	Status       int8       `gorm:"default:0" json:"status"` // 0未处理 1处理中 2已处理 3已忽略
	HandledBy    *uint      `json:"handled_by"`
	HandledAt    *time.Time `json:"handled_at"`
	HandleResult string     `gorm:"type:text" json:"handle_result"`
	Notified     bool       `gorm:"default:false" json:"notified"`
	NotifyTime   *time.Time `json:"notify_time"`
	AlarmTime    time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"alarm_time"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// User 用户
type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash string         `gorm:"size:100;not null" json:"-"`
	RealName     string         `gorm:"size:50" json:"real_name"`
	Phone        string         `gorm:"size:20" json:"phone"`
	Email        string         `gorm:"size:100" json:"email"`
	Department   string         `gorm:"size:50" json:"department"`
	Position     string         `gorm:"size:50" json:"position"`
	Avatar       string         `gorm:"size:200" json:"avatar"`
	Status       int8           `gorm:"default:1" json:"status"`
	LastLogin    *time.Time     `json:"last_login"`
	LastLoginIP  string         `gorm:"size:50" json:"last_login_ip"`
	LoginCount   int            `gorm:"default:0" json:"login_count"`
	Roles        []Role         `gorm:"many2many:user_roles" json:"roles,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// Role 角色
type Role struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	Name        string       `gorm:"size:50;not null" json:"name"`
	Code        string       `gorm:"uniqueIndex;size:50;not null" json:"code"`
	Description string       `gorm:"type:text" json:"description"`
	IsSystem    bool         `gorm:"default:false" json:"is_system"`
	Status      int8         `gorm:"default:1" json:"status"`
	Permissions []Permission `gorm:"many2many:role_permissions" json:"permissions,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// Permission 权限
type Permission struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Code        string    `gorm:"uniqueIndex;size:100;not null" json:"code"`
	Resource    string    `gorm:"size:50" json:"resource"`
	Action      string    `gorm:"size:50" json:"action"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// AuditLog 审计日志
type AuditLog struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        *uint     `json:"user_id"`
	Username      string    `gorm:"size:50" json:"username"`
	Action        string    `gorm:"size:50;not null" json:"action"`
	ResourceType  string    `gorm:"size:50" json:"resource_type"`
	ResourceID    string    `gorm:"size:50" json:"resource_id"`
	Description   string    `gorm:"type:text" json:"description"`
	RequestPath   string    `gorm:"size:200" json:"request_path"`
	RequestMethod string    `gorm:"size:10" json:"request_method"`
	ResponseCode  int       `json:"response_code"`
	IPAddress     string    `gorm:"size:50" json:"ip_address"`
	UserAgent     string    `gorm:"size:500" json:"user_agent"`
	DurationMS    int       `json:"duration_ms"`
	CreatedAt     time.Time `json:"created_at"`
}

