package handlers

import (
	"errors"
	"math"
	"net/http"
	"strconv"

	"product-management/backend/internal/models"
	"product-management/backend/internal/services"
	apperrors "product-management/backend/pkg/errors"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// ProductHandler รับผิดชอบ HTTP layer ของ product
type ProductHandler struct {
	service services.ProductService
}

// NewProductHandler สร้าง ProductHandler พร้อม service
func NewProductHandler(service services.ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

// GetAll godoc
// GET /api/v1/products?page=1&limit=20&search=123
func (h *ProductHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit < 1 || limit > 1000 {
		c.JSON(http.StatusBadRequest, apperrors.ErrInvalidLimit)
		return
	}

	search := c.Query("search") // กรองด้วย ProductCode (ค้นหาแบบ contains)
	offset := (page - 1) * limit

	products, total, err := h.service.GetAll(limit, offset, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServerError)
		return
	}

	var totalPages int
	if limit > 0 {
		totalPages = int(math.Ceil(float64(total) / float64(limit)))
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  products,
		"meta": gin.H{
			"page":        page,
			"limit":       limit,
			"total_items": total,
			"total_pages": totalPages,
		},
	})
}

// Create godoc
// POST /api/v1/products
// Body: { "product_code": "30 หลัก" }
func (h *ProductHandler) Create(c *gin.Context) {
	var req models.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		var ve validator.ValidationErrors
		if errors.As(err, &ve) {
			// binding tag ล้มเหลว: required, len=30 หรือ uppercase_alphanum
			c.JSON(http.StatusBadRequest, apperrors.ErrInvalidProductCode)
		} else {
			// JSON ผิดรูปแบบ เช่น body ว่าง หรือ syntax error
			c.JSON(http.StatusBadRequest, apperrors.ErrBadRequest)
		}
		return
	}

	product, err := h.service.Create(&req)
	if err != nil {
		var appErr *apperrors.AppError
		if errors.As(err, &appErr) {
			if appErr == apperrors.ErrProductCodeDuplicate {
				c.JSON(http.StatusConflict, appErr)
				return
			}
			c.JSON(http.StatusBadRequest, appErr)
			return
		}
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServerError)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": product})
}

// Delete godoc
// DELETE /api/v1/products/:id
func (h *ProductHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, apperrors.ErrBadRequest)
		return
	}

	if err := h.service.Delete(id); err != nil {
		var appErr *apperrors.AppError
		if errors.As(err, &appErr) {
			if appErr == apperrors.ErrNotFound {
				c.JSON(http.StatusNotFound, appErr)
				return
			}
			c.JSON(http.StatusBadRequest, appErr)
			return
		}
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServerError)
		return
	}

	c.Status(http.StatusNoContent)
}
