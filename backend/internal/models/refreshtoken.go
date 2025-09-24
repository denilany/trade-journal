package models

import "time"

type RefreshToken struct {
	ID         int64     `gorm:"primaryKey" json:"id"`
	UserID     int64     `gorm:"index;not null" json:"userId"`
	TokenHash  string    `gorm:"size:64;index;not null" json:"-"` // sha256 hex
	ExpiresAt  time.Time `gorm:"index" json:"expiresAt"`
	RevokedAt  *time.Time `json:"revokedAt"`
	CreatedAt  time.Time `json:"createdAt"`
}