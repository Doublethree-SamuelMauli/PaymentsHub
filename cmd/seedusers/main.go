// Seeds demo users (admin, approver, operator, viewer) with bcrypt passwords.
package main

import (
	"context"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
)

func main() {
	dsn := os.Getenv("PH_DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://paymentshub:paymentshub@localhost:5434/paymentshub?sslmode=disable"
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	q := dbgen.New(pool)

	// Get the seeded client
	var clientID pgtype.UUID
	if err := pool.QueryRow(ctx, "SELECT id FROM clients LIMIT 1").Scan(&clientID); err != nil {
		log.Fatal("no client found - run seed first: ", err)
	}

	// Clean existing users
	_, _ = pool.Exec(ctx, "DELETE FROM users")

	users := []struct {
		email, name, role, password string
	}{
		{"admin@doublethree.com.br", "Samuel Mauli", "admin", "admin123"},
		{"approver@doublethree.com.br", "Aprovador Financeiro", "approver", "approver123"},
		{"operator@doublethree.com.br", "Operador Pagamentos", "operator", "operator123"},
		{"viewer@doublethree.com.br", "Viewer Auditoria", "viewer", "viewer123"},
	}

	for _, u := range users {
		hash, _ := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		_, err := q.InsertUser(ctx, dbgen.InsertUserParams{
			ID:           pgtype.UUID{Bytes: uuid.New(), Valid: true},
			ClientID:     clientID,
			Email:        u.email,
			PasswordHash: string(hash),
			Name:         u.name,
			Role:         u.role,
			Active:       true,
		})
		if err != nil {
			log.Printf("failed %s: %v", u.email, err)
			continue
		}
		log.Printf("  [%s] %s / %s", u.role, u.email, u.password)
	}

	log.Println("Users seeded!")
}
