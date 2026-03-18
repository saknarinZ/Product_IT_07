package repositories

import (
	"errors"
	"fmt"

	"product-management/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProductRepository กำหนด contract ของการเข้าถึงข้อมูล Product
type ProductRepository interface {
	FindAll(limit, offset int, search string) ([]models.Product, int64, error)
	FindByProductCode(code string) (*models.Product, error)
	Create(product *models.Product) error
	Delete(id uuid.UUID) error
}

// productRepository คือ GORM implementation
type productRepository struct {
	db *gorm.DB
}

// NewProductRepository สร้าง productRepository พร้อม db connection
func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

// FindAll ดึง product ทั้งหมดที่ยังไม่ถูกลบ เรียงจากใหม่ → เก่า
// search = กรองด้วย ProductCode (LIKE), limit=0 = ดึงทั้งหมด
func (r *productRepository) FindAll(limit, offset int, search string) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64
	query := r.db.Model(&models.Product{})

	// กรองด้วย ProductCode ถ้ามี search
	if search != "" {
		query = query.Where("product_code LIKE ?", "%"+search+"%")
	}

	// นับจำนวนทั้งหมดก่อนใส่ limit/offset
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("repository.FindAll count: %w", err)
	}

	// ใส่ pagination เฉพาะเมื่อ limit > 0
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}

	result := query.Order("created_at DESC").Find(&products)
	if result.Error != nil {
		return nil, 0, fmt.Errorf("repository.FindAll: %w", result.Error)
	}
	return products, total, nil
}

// FindByProductCode ค้นหา product ด้วย ProductCode (30 หลัก)
// ใช้สำหรับตรวจซ้ำก่อน Create
func (r *productRepository) FindByProductCode(code string) (*models.Product, error) {
	var product models.Product
	result := r.db.Where("product_code = ?", code).First(&product)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, gorm.ErrRecordNotFound
	}
	if result.Error != nil {
		return nil, fmt.Errorf("repository.FindByProductCode: %w", result.Error)
	}
	return &product, nil
}

// Create เพิ่ม product ใหม่ลงใน DB
func (r *productRepository) Create(product *models.Product) error {
	result := r.db.Create(product)
	if result.Error != nil {
		return fmt.Errorf("repository.Create: %w", result.Error)
	}
	return nil
}

// Delete ทำ Soft Delete (แสตมป์ deleted_at ไม่ลบจริง)
func (r *productRepository) Delete(id uuid.UUID) error {
	result := r.db.Delete(&models.Product{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("repository.Delete: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
