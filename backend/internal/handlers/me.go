package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourorg/yourapp-auth/internal/middleware"
	"github.com/yourorg/yourapp-auth/internal/models"
)

func (h *Handlers) handleMe(c *gin.Context) {
	mw := middleware.AuthRequired()
	mw(c)
	if c.IsAborted() { return }
	uidVal, _ := c.Get("userID")
	uid, _ := uidVal.(int64)
	var u models.User
	if err := h.db.First(&u, uid).Error; err != nil { c.AbortWithStatus(http.StatusUnauthorized); return }
	c.JSON(http.StatusOK, gin.H{"id": u.ID, "name": u.Name, "email": u.Email, "createdAt": u.CreatedAt})
}