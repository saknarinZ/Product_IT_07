package config

import (
	"fmt"
	"log"
	"time"

	"product-management/backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// ConnectDB สร้าง connection ไปยัง PostgreSQL และรัน Auto Migration
func ConnectDB(cfg *Config) *gorm.DB {
	// สร้าง DSN (Data Source Name) จาก config
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBSSLMode,
		cfg.DBTimezone,
	)

	// เลือก log level ตาม GIN_MODE
	logLevel := logger.Info
	if cfg.GinMode == "release" {
		logLevel = logger.Silent
	}

	// เปิด connection
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	// ── Connection Pool ───────────────────────────────────────────────────────
	// ดึง underlying *sql.DB มาตั้งค่า pool
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("❌ Failed to get sql.DB: %v", err)
	}

	// จำนวน connection สูงสุดที่เปิดพร้อมกันได้ (ป้องกัน DB รับไม่ไหว)
	sqlDB.SetMaxOpenConns(25)

	// จำนวน connection ที่ keep-alive ไว้ใน pool (ไม่ต้องสร้าง connection ใหม่ทุกครั้ง)
	sqlDB.SetMaxIdleConns(10)

	// อายุสูงสุดของ connection (หลังจากนี้จะถูกปิดและสร้างใหม่)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)
	// ─────────────────────────────────────────────────────────────────────────

	// Auto Migrate — สร้าง/อัปเดต table ให้ตรงกับ struct อัตโนมัติ
	if err := db.AutoMigrate(&models.Product{}); err != nil {
		log.Fatalf("❌ Failed to run database migration: %v", err)
	}

	log.Println("✅ Database connected and migrated successfully")
	log.Printf("📦 Connection Pool: maxOpen=25, maxIdle=10, maxLifetime=5m")
	return db
}
