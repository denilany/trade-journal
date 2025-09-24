package auth

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	Sub int64 `json:"sub"`
	jwt.RegisteredClaims
}

func IssueAccessToken(userID int64) (string, error) {
	secret := []byte(os.Getenv("JWT_ACCESS_SECRET"))
	if len(secret) == 0 { return "", ErrMissingSecret }
	iss := os.Getenv("JWT_ISSUER")
	aud := os.Getenv("JWT_AUDIENCE")
	ttlMin := 15
	if v := os.Getenv("JWT_ACCESS_TTL_MIN"); v != "" {
		if n, err := time.ParseDuration(v+"m"); err == nil { ttlMin = int(n/time.Minute) }
	}
	now := time.Now()
	claims := Claims{
		Sub: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer: iss,
			Audience: jwt.ClaimStrings{aud},
			IssuedAt: jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(ttlMin) * time.Minute)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

var ErrMissingSecret = jwt.ErrTokenUnverifiable