package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/yourorg/yourapp-auth/internal/db"
	"github.com/yourorg/yourapp-auth/internal/handlers"
	"github.com/yourorg/yourapp-auth/internal/migrate"
)

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" { port = "8080" }
	env := os.Getenv("ENV")
	if env == "" { env = "development" }

	gormDB := db.MustConnect()
	migrate.MustRun()

	r := gin.New()
	r.Use(gin.Recovery())
	if env != "production" { r.Use(gin.Logger()) }

	cfg := cors.Config{
		AllowOrigins:     parseCSVEnv("FRONTEND_ORIGIN", "http://localhost:3000"),
		AllowMethods:     []string{"GET","POST","PUT","PATCH","DELETE","OPTIONS"},
		AllowHeaders:     []string{"Origin","Content-Type","Accept","Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	r.Use(cors.New(cfg))

	// Healthcheck
	r.GET("/health", func(c *gin.Context){ c.JSON(http.StatusOK, gin.H{"status":"ok"}) })

	// API routes
	api := r.Group("/api")
	h := handlers.New(gormDB)
	h.RegisterRoutes(api)

	log.Printf("Auth server listening on :%s", port)
	if err := r.Run(":"+port); err != nil { log.Fatal(err) }
}

func parseCSVEnv(key, def string) []string {
	v := os.Getenv(key)
	if v == "" { v = def }
	parts := strings.Split(v, ",")
	out := make([]string,0,len(parts))
	for _,p := range parts { p = strings.TrimSpace(p); if p != "" { out = append(out, p) } }
	return out
}