package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config เก็บค่า configuration ทั้งหมดของ application
type Config struct {
	// Application
	AppPort string
	GinMode string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	DBTimezone string
}

// Load อ่านค่าจากไฟล์ .env (ถ้ามี) แล้ว map เข้า Config struct
func Load() *Config {
	// โหลด .env จาก root ก่อน (รัน local จาก backend/) ถ้าไม่มีลอง current dir
	if err := godotenv.Load("../.env"); err != nil {
		if err := godotenv.Load(); err != nil {
			log.Println("⚠️  .env file not found, using OS environment variables")
		}
	}

	return &Config{
		// Application
		AppPort: getEnv("APP_PORT", "8080"),
		GinMode: getEnv("GIN_MODE", "debug"),

		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "product_management"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		DBTimezone: getEnv("DB_TIMEZONE", "Asia/Bangkok"),
	}
}

// getEnv อ่านค่า environment variable ถ้าไม่มีใช้ค่า defaultVal แทน
func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
