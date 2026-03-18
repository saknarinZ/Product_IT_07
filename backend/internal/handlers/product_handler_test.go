package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"product-management/backend/internal/config"
	"product-management/backend/internal/models"
	apperrors "product-management/backend/pkg/errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ── mock service ──────────────────────────────────────────────────────────────

type mockService struct {
	getAllFn  func(limit, offset int, search string) ([]models.Product, int64, error)
	createFn func(req *models.CreateProductRequest) (*models.Product, error)
	deleteFn func(id uuid.UUID) error
}

func (m *mockService) GetAll(limit, offset int, search string) ([]models.Product, int64, error) {
	return m.getAllFn(limit, offset, search)
}

func (m *mockService) Create(req *models.CreateProductRequest) (*models.Product, error) {
	return m.createFn(req)
}

func (m *mockService) Delete(id uuid.UUID) error {
	return m.deleteFn(id)
}

// ── helper ────────────────────────────────────────────────────────────────────

func setupRouter(svc *mockService) *gin.Engine {
	config.RegisterCustomValidators()
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := NewProductHandler(svc)
	r.GET("/products", h.GetAll)
	r.POST("/products", h.Create)
	r.DELETE("/products/:id", h.Delete)
	return r
}

func doRequest(r *gin.Engine, method, url string, body []byte) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, url, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req = httptest.NewRequest(method, url, nil)
	}
	r.ServeHTTP(w, req)
	return w
}

// ── GetAll ────────────────────────────────────────────────────────────────────

func TestGetAllSuccess(t *testing.T) {
	products := []models.Product{{ProductCode: "123456789012345678901234567890"}}
	svc := &mockService{
		getAllFn: func(limit, offset int, search string) ([]models.Product, int64, error) {
			return products, 1, nil
		},
	}

	w := doRequest(setupRouter(svc), http.MethodGet, "/products", nil)

	assert.Equal(t, http.StatusOK, w.Code)
	var body map[string]any
	json.Unmarshal(w.Body.Bytes(), &body)
	assert.NotNil(t, body["data"])
	assert.NotNil(t, body["meta"])
}

func TestGetAllDefaultParams(t *testing.T) {
	svc := &mockService{
		getAllFn: func(limit, offset int, search string) ([]models.Product, int64, error) {
			// default: page=1, limit=50 → offset=0
			assert.Equal(t, 50, limit)
			assert.Equal(t, 0, offset)
			assert.Equal(t, "", search)
			return nil, 0, nil
		},
	}

	w := doRequest(setupRouter(svc), http.MethodGet, "/products", nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetAllPaginationMeta(t *testing.T) {
	svc := &mockService{
		getAllFn: func(limit, offset int, search string) ([]models.Product, int64, error) {
			return []models.Product{}, 25, nil
		},
	}

	w := doRequest(setupRouter(svc), http.MethodGet, "/products?page=2&limit=10", nil)

	assert.Equal(t, http.StatusOK, w.Code)
	var body map[string]any
	json.Unmarshal(w.Body.Bytes(), &body)
	meta := body["meta"].(map[string]any)
	assert.Equal(t, float64(3), meta["total_pages"]) // ceil(25/10) = 3
	assert.Equal(t, float64(2), meta["page"])
	assert.Equal(t, float64(10), meta["limit"])
	assert.Equal(t, float64(25), meta["total_items"])
}

func TestGetAllSearchParam(t *testing.T) {
	svc := &mockService{
		getAllFn: func(limit, offset int, search string) ([]models.Product, int64, error) {
			assert.Equal(t, "12345", search)
			return nil, 0, nil
		},
	}

	w := doRequest(setupRouter(svc), http.MethodGet, "/products?search=12345", nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetAllServiceError(t *testing.T) {
	svc := &mockService{
		getAllFn: func(limit, offset int, search string) ([]models.Product, int64, error) {
			return nil, 0, errors.New("db error")
		},
	}

	w := doRequest(setupRouter(svc), http.MethodGet, "/products", nil)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ── Create ────────────────────────────────────────────────────────────────────

func TestCreateSuccess(t *testing.T) {
	code := "123456789012345678901234567890"
	product := &models.Product{ID: uuid.New(), ProductCode: code}
	svc := &mockService{
		createFn: func(req *models.CreateProductRequest) (*models.Product, error) {
			return product, nil
		},
	}
	body, _ := json.Marshal(map[string]string{"product_code": code})

	w := doRequest(setupRouter(svc), http.MethodPost, "/products", body)

	assert.Equal(t, http.StatusCreated, w.Code)
	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NotNil(t, resp["data"])
}

func TestCreateInvalidJSON(t *testing.T) {
	svc := &mockService{}

	w := doRequest(setupRouter(svc), http.MethodPost, "/products", []byte("not-json"))

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var body map[string]any
	json.Unmarshal(w.Body.Bytes(), &body)
	assert.Equal(t, "ERR_BAD_REQUEST", body["error_code"])
}

func TestCreateMissingProductCode(t *testing.T) {
	svc := &mockService{}
	body, _ := json.Marshal(map[string]string{})

	w := doRequest(setupRouter(svc), http.MethodPost, "/products", body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "ERR_INVALID_PRODUCT_CODE", resp["error_code"])
}

func TestCreateInvalidProductCodeFormat(t *testing.T) {
	tests := []struct {
		name string
		code string
	}{
		{"too short", "12345"},
		{"lowercase", "abcdefghijklmnopqrstuvwxyz1234"},
		{"has dash", "12345-12345-12345-12345-12345-"},
		{"has space", "12345 12345 12345 12345 123456"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := &mockService{}
			body, _ := json.Marshal(map[string]string{"product_code": tt.code})
			w := doRequest(setupRouter(svc), http.MethodPost, "/products", body)
			assert.Equal(t, http.StatusBadRequest, w.Code)
			var resp map[string]any
			json.Unmarshal(w.Body.Bytes(), &resp)
			assert.Equal(t, "ERR_INVALID_PRODUCT_CODE", resp["error_code"])
		})
	}
}

func TestCreateDuplicateCode(t *testing.T) {
	svc := &mockService{
		createFn: func(req *models.CreateProductRequest) (*models.Product, error) {
			return nil, apperrors.ErrProductCodeDuplicate
		},
	}
	body, _ := json.Marshal(map[string]string{"product_code": "123456789012345678901234567890"})

	w := doRequest(setupRouter(svc), http.MethodPost, "/products", body)

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestCreateServiceInternalError(t *testing.T) {
	svc := &mockService{
		createFn: func(req *models.CreateProductRequest) (*models.Product, error) {
			return nil, errors.New("unexpected db error")
		},
	}
	body, _ := json.Marshal(map[string]string{"product_code": "123456789012345678901234567890"})

	w := doRequest(setupRouter(svc), http.MethodPost, "/products", body)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ── Delete ────────────────────────────────────────────────────────────────────

func TestDeleteSuccess(t *testing.T) {
	id := uuid.New()
	svc := &mockService{
		deleteFn: func(got uuid.UUID) error {
			assert.Equal(t, id, got)
			return nil
		},
	}

	w := doRequest(setupRouter(svc), http.MethodDelete, "/products/"+id.String(), nil)

	assert.Equal(t, http.StatusNoContent, w.Code)
}

func TestDeleteInvalidUUID(t *testing.T) {
	svc := &mockService{}

	w := doRequest(setupRouter(svc), http.MethodDelete, "/products/not-a-uuid", nil)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestDeleteNotFound(t *testing.T) {
	svc := &mockService{
		deleteFn: func(id uuid.UUID) error {
			return apperrors.ErrNotFound
		},
	}

	w := doRequest(setupRouter(svc), http.MethodDelete, "/products/"+uuid.New().String(), nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestDeleteInternalError(t *testing.T) {
	svc := &mockService{
		deleteFn: func(id uuid.UUID) error {
			return errors.New("db error")
		},
	}

	w := doRequest(setupRouter(svc), http.MethodDelete, "/products/"+uuid.New().String(), nil)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}
