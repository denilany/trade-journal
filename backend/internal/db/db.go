package db

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yourorg/yourapp-auth/internal/models"
)

var gormDB *gorm.DB

func MustConnect() *gorm.DB {
	if gormDB != nil { return gormDB }
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" { log.Fatal("DATABASE_URL not set") }
	lg := logger.Default
	if os.Getenv("ENV") == "production" {
		lg = lg.LogMode(logger.Warn)
	} else {
		lg = lg.LogMode(logger.Info)
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{ Logger: lg })
	if err != nil { log.Fatal(err) }
	// Auto-migrate as safety net
	if err := db.AutoMigrate(&models.User{}, &models.RefreshToken{}); err != nil { log.Fatal(err) }
	gormDB = db
	return db
}