package config

import (
	"regexp"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

var reUpperAlphanum = regexp.MustCompile(`^[A-Z0-9]+$`)

// RegisterCustomValidators ลงทะเบียน validation tags พิเศษสำหรับ Gin binding
// ต้องเรียกก่อน Setup router
func RegisterCustomValidators() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("uppercase_alphanum", func(fl validator.FieldLevel) bool { //nolint:errcheck
			return reUpperAlphanum.MatchString(fl.Field().String())
		})
	}
}
