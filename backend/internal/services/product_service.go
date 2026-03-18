package services

import (
	"errors"
	"fmt"
	"strings"

	"product-management/backend/internal/models"
	"product-management/backend/internal/repositories"
	apperrors "product-management/backend/pkg/errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ─────────────────────────────────────────────────────────────────────────────

// ProductService กำหนด contract ของ business logic
type ProductService interface {
	GetAll(limit, offset int, search string) ([]models.Product, int64, error)
	Create(req *models.CreateProductRequest) (*models.Product, error)
	Delete(id uuid.UUID) error
}

type productService struct {
	repo repositories.ProductRepository
}

// NewProductService สร้าง productService พร้อม repository
func NewProductService(repo repositories.ProductRepository) ProductService {
	return &productService{repo: repo}
}

// GetAll ดึงสินค้าทั้งหมด รองรับ pagination และ search
func (s *productService) GetAll(limit, offset int, search string) ([]models.Product, int64, error) {
	return s.repo.FindAll(limit, offset, search)
}

// Create สร้างสินค้าใหม่ พร้อมตรวจ ProductCode ซ้ำ
func (s *productService) Create(req *models.CreateProductRequest) (*models.Product, error) {
	// ── ชั้นที่ 2: ตรวจ ProductCode ซ้ำก่อน insert ───────────────────────────
	// (ชั้นที่ 1 คือ Handler binding:len=30, ชั้นที่ 3 คือ DB uniqueIndex)
	existing, err := s.repo.FindByProductCode(req.ProductCode)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("service.Create: check duplicate: %w", err)
	}
	if existing != nil {
		return nil, apperrors.ErrProductCodeDuplicate
	}
	// ─────────────────────────────────────────────────────────────────────────

	product := &models.Product{
		ID:          uuid.New(), // generate UUID ใน Go โดยตรง ไม่รอ DB default
		ProductCode: req.ProductCode,
	}

	if err := s.repo.Create(product); err != nil {
		// ชั้นที่ 3: DB uniqueIndex ป้องกัน race condition (2 request พร้อมกัน)
		if strings.Contains(err.Error(), "duplicate key") ||
			strings.Contains(err.Error(), "idx_product_code") {
			return nil, apperrors.ErrProductCodeDuplicate
		}
		return nil, fmt.Errorf("service.Create: %w", err)
	}

	return product, nil
}

// Delete ลบสินค้าด้วย UUID (Soft Delete)
func (s *productService) Delete(id uuid.UUID) error {
	err := s.repo.Delete(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return apperrors.ErrNotFound
	}
	return err
}
