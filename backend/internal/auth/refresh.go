package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

func NewOpaqueToken() (plain string, hash string, err error) {
	b := make([]byte, 32)
	if _, err = rand.Read(b); err != nil { return "","", err }
	plain = base64.RawURLEncoding.EncodeToString(b)
	h := sha256.Sum256([]byte(plain))
	hash = hex.EncodeToString(h[:])
	return
}

func CookieSettings() (domain string, secure bool, sameSite http.SameSite) {
	domain = os.Getenv("COOKIE_DOMAIN")
	secure = strings.ToLower(os.Getenv("COOKIE_SECURE")) == "true"
	switch strings.ToLower(os.Getenv("COOKIE_SAMESITE")) {
	case "none": sameSite = http.SameSiteNoneMode
	case "lax": sameSite = http.SameSiteLaxMode
	case "strict": sameSite = http.SameSiteStrictMode
	default: sameSite = http.SameSiteLaxMode
	}
	return
}

func RefreshTTL() time.Duration {
	if v := os.Getenv("REFRESH_TOKEN_TTL_DAYS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 { return time.Duration(n) * 24 * time.Hour }
	}
	return 30 * 24 * time.Hour
}

var ErrInvalidRefresh = errors.New("invalid refresh token")