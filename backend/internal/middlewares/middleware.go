package middlewares

import (
	"log"
	"net/http"
	"time"

	apperrors "product-management/backend/pkg/errors"

	"github.com/gin-gonic/gin"
)

// Logger Middleware บันทึก request และ response time
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		t := time.Now()

		// ให้ request ทำงานต่อไปจนเสร็จ
		c.Next()

		// คำนวณเวลาที่ใช้
		latency := time.Since(t)
		status := c.Writer.Status()

		log.Printf("[API] %s %s [%d] %v", c.Request.Method, c.Request.URL.Path, status, latency)
	}
}

// ErrorHandler Middleware ดักจับ panic ทั่วทั้งแอป เพื่อไม่ให้ server ล่ม
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[PANIC RECOVER] %v", err)
				c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServerError)
				c.Abort()
			}
		}()
		c.Next()
	}
}
