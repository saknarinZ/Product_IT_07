package routes

import (
	"net/http"

	"product-management/backend/internal/config"
	"product-management/backend/internal/handlers"
	"product-management/backend/internal/middlewares"
	"product-management/backend/internal/repositories"
	"product-management/backend/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Setup wire dependencies และ register routes ทั้งหมด
func Setup(db *gorm.DB) *gin.Engine {
	// Register custom validators: uppercase_alphanum เป็นต้น
	config.RegisterCustomValidators()

	// ใช้ gin.New() แทน Default() เพื่อใส่ Middleware เอง
	r := gin.New()

	// ── Global Middlewares ────────────────────────────────────────────────────
	r.Use(middlewares.Logger())
	r.Use(middlewares.ErrorHandler())

	// ── CORS ──────────────────────────────────────────────────────────────────
	// dev: อนุญาต Angular frontend ที่ localhost:4200
	// prod: เปลี่ยน AllowOrigins เป็น domain จริง
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4200", "http://localhost:80"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// ── Health Check ──────────────────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// ── Dependency Injection ──────────────────────────────────────────────────
	productRepo := repositories.NewProductRepository(db)
	productService := services.NewProductService(productRepo)
	productHandler := handlers.NewProductHandler(productService)

	// ── API Routes ────────────────────────────────────────────────────────────
	api := r.Group("/api/v1")
	{
		products := api.Group("/products")
		{
			products.GET("", productHandler.GetAll)       // GET  /api/v1/products
			products.POST("", productHandler.Create)      // POST /api/v1/products
			products.DELETE("/:id", productHandler.Delete) // DELETE /api/v1/products/:id
		}
	}

	return r
}
