package apperrors

import "fmt"

// AppError คือโครงสร้าง Error มาตรฐานสำหรับส่งให้ Frontend
type AppError struct {
	ErrorCode string `json:"error_code"`
	Message   string `json:"message"`
}

// Error ทำให้ AppError implement แต่อินเทอร์เฟซ error ของ Go
func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s", e.ErrorCode, e.Message)
}

// สร้าง App-wide Sentinel Errors ด้วย ErrorCode มาตรฐาน
var (
	ErrNotFound = &AppError{
		ErrorCode: "ERR_NOT_FOUND",
		Message:   "The requested resource was not found.",
	}

	ErrProductCodeDuplicate = &AppError{
		ErrorCode: "ERR_DUP_PRODUCT_CODE",
		Message:   "The product code already exists in the system.",
	}

	ErrInternalServerError = &AppError{
		ErrorCode: "ERR_INTERNAL",
		Message:   "An internal server error occurred.",
	}

	ErrBadRequest = &AppError{
		ErrorCode: "ERR_BAD_REQUEST",
		Message:   "Invalid request format or parameters.",
	}

	ErrInvalidProductCode = &AppError{
		ErrorCode: "ERR_INVALID_PRODUCT_CODE",
		Message:   "Product code must be exactly 30 uppercase alphanumeric characters (A-Z, 0-9).",
	}

	ErrInvalidLimit = &AppError{
		ErrorCode: "ERR_INVALID_LIMIT",
		Message:   "The 'limit' parameter must be between 1 and 1000.",
	}
)

// New สร้าง Custom AppError แบบ Ad-hoc ได้ถ้าจำเป็น
func New(code, message string) *AppError {
	return &AppError{
		ErrorCode: code,
		Message:   message,
	}
}
