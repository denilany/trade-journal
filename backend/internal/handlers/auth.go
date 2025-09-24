package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yourorg/yourapp-auth/internal/auth"
	"github.com/yourorg/yourapp-auth/internal/models"
)

type Handlers struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Handlers { return &Handlers{db: db} }

func (h *Handlers) RegisterRoutes(r *gin.RouterGroup) {
	au := r.Group("/auth")
	{
		au.POST("/register", h.handleRegister)
		au.POST("/login", h.handleLogin)
		au.POST("/refresh", h.handleRefresh)
		au.POST("/logout", h.handleLogout)
	}
	r.GET("/me", h.handleMe)
}

type registerReq struct {
	Name string `json:"name" binding:"required,min=2,max=120"`
	Email string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

func (h *Handlers) handleRegister(c *gin.Context) {
	var req registerReq
	if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	// check existing
	var count int64
	h.db.Model(&models.User{}).Where("email = ?", req.Email).Count(&count)
	if count > 0 { c.JSON(http.StatusConflict, gin.H{"error":"Email already registered"}); return }
	hash, err := auth.HashPassword(req.Password)
	if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"hash error"}); return }
	u := models.User{Name: req.Name, Email: req.Email, PasswordHash: hash}
	if err := h.db.Create(&u).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"db error"}); return }
	c.JSON(http.StatusCreated, gin.H{"id": u.ID, "name": u.Name, "email": u.Email})
}

type loginReq struct {
	Email string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
	RememberMe bool `json:"rememberMe"`
}

func (h *Handlers) handleLogin(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	var u models.User
	if err := h.db.Where("email = ?", req.Email).First(&u).Error; err != nil { c.JSON(http.StatusUnauthorized, gin.H{"error":"invalid credentials"}); return }
	if !auth.CheckPassword(u.PasswordHash, req.Password) { c.JSON(http.StatusUnauthorized, gin.H{"error":"invalid credentials"}); return }
	access, err := auth.IssueAccessToken(u.ID)
	if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"token error"}); return }
	plain, hash, err := auth.NewOpaqueToken()
	if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"token error"}); return }
	ttl := auth.RefreshTTL()
	if req.RememberMe { /* keep default ttl */ } else { ttl = 7 * 24 * time.Hour }
	rt := models.RefreshToken{ UserID: u.ID, TokenHash: hash, ExpiresAt: time.Now().Add(ttl) }
	if err := h.db.Create(&rt).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"db error"}); return }
	setRefreshCookie(c, plain, ttl)
	c.JSON(http.StatusOK, gin.H{"access_token": access})
}

func (h *Handlers) handleRefresh(c *gin.Context) {
	plain, err := c.Cookie("refresh_token")
	if err != nil || plain == "" { c.JSON(http.StatusUnauthorized, gin.H{"error":"missing refresh"}); return }
	hash := sha256Hex(plain)
	var rt models.RefreshToken
	if err := h.db.Where("token_hash = ? AND revoked_at IS NULL AND expires_at > ?", hash, time.Now()).First(&rt).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error":"invalid refresh"}); return
	}
	// rotate
	now := time.Now()
	h.db.Model(&rt).Update("revoked_at", &now)
	plainNew, hashNew, err := auth.NewOpaqueToken()
	if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"token error"}); return }
	// New ttl preserves remaining or resets to default
	rem := time.Until(rt.ExpiresAt)
	if rem <= 0 { rem = auth.RefreshTTL() }
	rtNew := models.RefreshToken{ UserID: rt.UserID, TokenHash: hashNew, ExpiresAt: time.Now().Add(rem) }
	if err := h.db.Create(&rtNew).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"db error"}); return }
	access, err := auth.IssueAccessToken(rt.UserID)
	if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"token error"}); return }
	setRefreshCookie(c, plainNew, rem)
	c.JSON(http.StatusOK, gin.H{"access_token": access})
}

func (h *Handlers) handleLogout(c *gin.Context) {
	plain, _ := c.Cookie("refresh_token")
	if plain != "" {
		hash := sha256Hex(plain)
		h.db.Model(&models.RefreshToken{}).Where("token_hash = ? AND revoked_at IS NULL", hash).Update("revoked_at", time.Now())
	}
	clearRefreshCookie(c)
	c.Status(http.StatusOK)
}

func setRefreshCookie(c *gin.Context, value string, ttl time.Duration) {
	domain, secure, sameSite := auth.CookieSettings()
	cookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    value,
		Path:     "/",
		Domain:   domain,
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   int(ttl.Seconds()),
	}
	http.SetCookie(c.Writer, cookie)
}

func clearRefreshCookie(c *gin.Context) {
	domain, secure, sameSite := auth.CookieSettings()
	cookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Domain:   domain,
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   -1,
	}
	http.SetCookie(c.Writer, cookie)
}

func sha256Hex(s string) string {
	sum := sha256.Sum256([]byte(s))
	return hex.EncodeToString(sum[:])
}