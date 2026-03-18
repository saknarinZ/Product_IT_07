package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Product คือ Blueprint ของตาราง products ใน PostgreSQL
type Product struct {
	// ใช้ UUID แทน Auto Increment (ID 1, 2, 3...) เพื่อความปลอดภัยและรองรับการ Scale ในอนาคต
	ID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	// เก็บ Pure Data 30 หลัก (ตัวเลขล้วน ไม่มีขีด '-')
	// ทำ uniqueIndex เพื่อห้ามซ้ำ และทำให้การค้นหาข้อมูลหลักล้านแถวเร็วขึ้น (O(log n))
	ProductCode string `gorm:"type:varchar(30);uniqueIndex:idx_active_product,where:deleted_at IS NULL;not null" json:"product_code"`

	// Audit logs (ใครเพิ่ม ใครแก้ เมื่อไหร่)
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Soft Delete: เวลาสั่งลบ จะไม่ลบข้อมูลจริงออกจาก DB แต่จะแสตมป์เวลาลงช่องนี้แทน (Senior Move!)
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName กำหนดชื่อ table ใน DB อย่างชัดเจน (ไม่ให้ GORM เดาเอง)
func (Product) TableName() string {
	return "products"
}

// CreateProductRequest คือข้อมูลที่รับจาก client ตอนสร้างสินค้าใหม่
type CreateProductRequest struct {
	// ProductCode ต้องเป็นตัวอักษรพิมพ์ใหญ่ A-Z หรือตัวเลข 0-9 ยาว 30 หลัก และห้ามซ้ำ
	ProductCode string `json:"product_code" binding:"required,len=30,uppercase_alphanum"`
}
