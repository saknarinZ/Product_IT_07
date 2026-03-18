package main

import (
	"log"

	"product-management/backend/internal/config"
	"product-management/backend/internal/routes"
)

func main() {
	// 1. โหลด environment variables จากไฟล์ .env
	cfg := config.Load()

	// 2. เชื่อมต่อ PostgreSQL และรัน Auto Migration
	db := config.ConnectDB(cfg)

	// 3. Setup Gin router พร้อม middleware และ routes ทั้งหมด
	router := routes.Setup(db)

	// 4. เปิด HTTP server
	addr := ":" + cfg.AppPort
	log.Printf("🚀 Server starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("❌ Server failed to start: %v", err)
	}
}
