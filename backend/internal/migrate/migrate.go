package migrate

import (
	"database/sql"
	"embed"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"

	_ "github.com/lib/pq"
)

// go:embed ../../migrations/*.sql
var migrationsFS embed.FS

func MustRun() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" { log.Fatal("DATABASE_URL not set") }
	db, err := sql.Open("postgres", dsn)
	if err != nil { log.Fatal(err) }
	defer db.Close()
	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY);`); err != nil { log.Fatal(err) }
	entries, err := migrationsFS.ReadDir("../../migrations")
	if err != nil { log.Fatal(err) }
	files := make([]string,0,len(entries))
	for _,e := range entries { if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") { files = append(files, e.Name()) } }
	sort.Strings(files)
	for _,name := range files {
		var cnt int
		if err := db.QueryRow("SELECT COUNT(1) FROM schema_migrations WHERE version=$1", name).Scan(&cnt); err != nil { log.Fatal(err) }
		if cnt > 0 { continue }
		b, err := migrationsFS.ReadFile("../../migrations/"+name)
		if err != nil { log.Fatal(err) }
		fmt.Printf("Applying migration %s...\n", name)
		if _, err := db.Exec(string(b)); err != nil { log.Fatal(fmt.Errorf("migration %s failed: %w", name, err)) }
		if _, err := db.Exec("INSERT INTO schema_migrations(version) VALUES($1)", name); err != nil { log.Fatal(err) }
	}
}