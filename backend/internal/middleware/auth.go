package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/yourorg/yourapp-auth/internal/auth"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if !strings.HasPrefix(strings.ToLower(h), "bearer ") { c.AbortWithStatus(http.StatusUnauthorized); return }
		tok := strings.TrimSpace(h[7:])
		secret := []byte(os.Getenv("JWT_ACCESS_SECRET"))
		claims := &auth.Claims{}
		_, err := jwt.ParseWithClaims(tok, claims, func(t *jwt.Token) (interface{}, error) { return secret, nil })
		if err != nil { c.AbortWithStatus(http.StatusUnauthorized); return }
		c.Set("userID", claims.Sub)
		c.Next()
	}
}