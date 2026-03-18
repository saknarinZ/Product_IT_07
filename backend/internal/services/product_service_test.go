package services

import (
	"errors"
	"testing"

	"product-management/backend/internal/models"
	apperrors "product-management/backend/pkg/errors"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// ── mock repository ───────────────────────────────────────────────────────────

type mockRepo struct {
	findAllFn           func(limit, offset int, search string) ([]models.Product, int64, error)
	findByProductCodeFn func(code string) (*models.Product, error)
	createFn            func(product *models.Product) error
	deleteFn            func(id uuid.UUID) error
}

func (m *mockRepo) FindAll(limit, offset int, search string) ([]models.Product, int64, error) {
	return m.findAllFn(limit, offset, search)
}

func (m *mockRepo) FindByProductCode(code string) (*models.Product, error) {
	return m.findByProductCodeFn(code)
}

func (m *mockRepo) Create(product *models.Product) error {
	return m.createFn(product)
}

func (m *mockRepo) Delete(id uuid.UUID) error {
	return m.deleteFn(id)
}

// ── GetAll ────────────────────────────────────────────────────────────────────

func TestGetAllReturnsProductsFromRepo(t *testing.T) {
	want := []models.Product{{ProductCode: "123456789012345678901234567890"}}
	repo := &mockRepo{
		findAllFn: func(limit, offset int, search string) ([]models.Product, int64, error) {
			return want, 1, nil
		},
	}
	svc := NewProductService(repo)

	got, total, err := svc.GetAll(10, 0, "")

	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Equal(t, want, got)
}

func TestGetAllPassesParamsToRepo(t *testing.T) {
	repo := &mockRepo{
		findAllFn: func(limit, offset int, search string) ([]models.Product, int64, error) {
			assert.Equal(t, 20, limit)
			assert.Equal(t, 40, offset)
			assert.Equal(t, "abc", search)
			return nil, 0, nil
		},
	}
	svc := NewProductService(repo)

	svc.GetAll(20, 40, "abc")
}

func TestGetAllReturnsRepoError(t *testing.T) {
	repo := &mockRepo{
		findAllFn: func(limit, offset int, search string) ([]models.Product, int64, error) {
			return nil, 0, errors.New("db error")
		},
	}
	svc := NewProductService(repo)

	_, _, err := svc.GetAll(10, 0, "")

	assert.Error(t, err)
}

// ── Create ────────────────────────────────────────────────────────────────────

func TestCreateSuccess(t *testing.T) {
	code := "123456789012345678901234567890"
	repo := &mockRepo{
		findByProductCodeFn: func(c string) (*models.Product, error) {
			return nil, gorm.ErrRecordNotFound
		},
		createFn: func(product *models.Product) error {
			return nil
		},
	}
	svc := NewProductService(repo)

	product, err := svc.Create(&models.CreateProductRequest{ProductCode: code})

	assert.NoError(t, err)
	assert.NotNil(t, product)
	assert.Equal(t, code, product.ProductCode)
	assert.NotEqual(t, uuid.Nil, product.ID)
}

func TestCreateDuplicateCode(t *testing.T) {
	existing := &models.Product{ProductCode: "123456789012345678901234567890"}
	repo := &mockRepo{
		findByProductCodeFn: func(code string) (*models.Product, error) {
			return existing, nil
		},
	}
	svc := NewProductService(repo)

	_, err := svc.Create(&models.CreateProductRequest{ProductCode: "123456789012345678901234567890"})

	assert.ErrorIs(t, err, apperrors.ErrProductCodeDuplicate)
}

func TestCreateRepoCheckError(t *testing.T) {
	repo := &mockRepo{
		findByProductCodeFn: func(code string) (*models.Product, error) {
			return nil, errors.New("connection lost")
		},
	}
	svc := NewProductService(repo)

	_, err := svc.Create(&models.CreateProductRequest{ProductCode: "123456789012345678901234567890"})

	assert.Error(t, err)
	assert.NotErrorIs(t, err, apperrors.ErrProductCodeDuplicate)
}

func TestCreateDuplicateKeyFromDB(t *testing.T) {
	repo := &mockRepo{
		findByProductCodeFn: func(code string) (*models.Product, error) {
			return nil, gorm.ErrRecordNotFound
		},
		createFn: func(product *models.Product) error {
			return errors.New("duplicate key value violates unique constraint idx_product_code")
		},
	}
	svc := NewProductService(repo)

	_, err := svc.Create(&models.CreateProductRequest{ProductCode: "123456789012345678901234567890"})

	assert.ErrorIs(t, err, apperrors.ErrProductCodeDuplicate)
}

func TestCreateRepoCreateError(t *testing.T) {
	repo := &mockRepo{
		findByProductCodeFn: func(code string) (*models.Product, error) {
			return nil, gorm.ErrRecordNotFound
		},
		createFn: func(product *models.Product) error {
			return errors.New("insert failed")
		},
	}
	svc := NewProductService(repo)

	_, err := svc.Create(&models.CreateProductRequest{ProductCode: "123456789012345678901234567890"})

	assert.Error(t, err)
	assert.NotErrorIs(t, err, apperrors.ErrProductCodeDuplicate)
}

// ── Delete ────────────────────────────────────────────────────────────────────

func TestDeleteSuccess(t *testing.T) {
	id := uuid.New()
	repo := &mockRepo{
		deleteFn: func(got uuid.UUID) error {
			assert.Equal(t, id, got)
			return nil
		},
	}
	svc := NewProductService(repo)

	err := svc.Delete(id)

	assert.NoError(t, err)
}

func TestDeleteNotFound(t *testing.T) {
	repo := &mockRepo{
		deleteFn: func(id uuid.UUID) error {
			return gorm.ErrRecordNotFound
		},
	}
	svc := NewProductService(repo)

	err := svc.Delete(uuid.New())

	assert.ErrorIs(t, err, apperrors.ErrNotFound)
}

func TestDeleteOtherError(t *testing.T) {
	repo := &mockRepo{
		deleteFn: func(id uuid.UUID) error {
			return errors.New("db error")
		},
	}
	svc := NewProductService(repo)

	err := svc.Delete(uuid.New())

	assert.Error(t, err)
	assert.NotErrorIs(t, err, apperrors.ErrNotFound)
}
