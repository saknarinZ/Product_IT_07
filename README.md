# Product Management System (IT 07)

ระบบจัดการสินค้าแบบ Full-Stack สำหรับสร้าง / แสดง / ลบ รหัสสินค้า 30 หลัก พร้อม QR Code และ Infinite Scroll

---

## 🛠️ Stack

| Layer    | Technology                                 |
| -------- | ------------------------------------------ |
| Backend  | Go 1.25.8 · Gin · GORM                     |
| Database | PostgreSQL 16                              |
| Frontend | Angular 21 · Angular CDK · Tailwind CSS v4 |
| DevOps   | Docker · Docker Compose                    |

---

## 🚀 วิธีรัน

```bash
# จาก directory product-management/
docker compose up -d --build
```

| Service    | URL                          |
| ---------- | ---------------------------- |
| Frontend   | http://localhost:4200        |
| Backend    | http://localhost:8080/health |
| PostgreSQL | localhost:5432               |

---

## 📂 Project Structure

```
product-management/
├── backend/
│   ├── cmd/api/main.go
│   └── internal/
│       ├── config/          # Config & DB connection
│       ├── models/          # Product entity (UUID, Soft Delete)
│       ├── repositories/    # GORM data access layer
│       ├── services/        # Business logic
│       ├── handlers/        # Gin HTTP handlers
│       ├── middlewares/     # CORS, etc.
│       └── routes/          # Route registration
│   └── pkg/errors/          # Standardized error responses
├── frontend/
│   └── src/app/features/products/
│       ├── api/             # ProductService (HttpClient)
│       ├── models/          # TypeScript interfaces
│       ├── state/           # ProductStore (Angular Signals)
│       └── ui/
│           ├── product-form/    # Add product form
│           ├── product-table/   # Virtual scroll + Infinite scroll table
│           └── qr-modal/        # QR Code modal
├── docker-compose.yml
├── Makefile
└── README.md
```
