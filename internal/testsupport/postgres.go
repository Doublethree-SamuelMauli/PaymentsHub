// Package testsupport provides fixtures shared across integration tests.
//
// SpawnPostgres starts a disposable Postgres container, applies all goose
// migrations from db/migrations, and returns the DSN plus a cleanup function
// registered via t.Cleanup.
package testsupport

import (
	"context"
	"database/sql"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pressly/goose/v3"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// OpenPool returns a pgxpool.Pool bound to the given DSN, with cleanup registered.
func OpenPool(t *testing.T, dsn string) *pgxpool.Pool {
	t.Helper()
	pool, err := pgxpool.New(context.Background(), dsn)
	require.NoError(t, err)
	t.Cleanup(pool.Close)
	return pool
}

// SpawnPostgres boots a postgres:16-alpine container, runs all migrations,
// and returns the DSN. The container is terminated at test cleanup.
func SpawnPostgres(t *testing.T) string {
	t.Helper()
	ctx := context.Background()

	container, err := tcpostgres.Run(ctx,
		"postgres:16-alpine",
		tcpostgres.WithDatabase("paymentshub"),
		tcpostgres.WithUsername("paymentshub"),
		tcpostgres.WithPassword("paymentshub"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(60*time.Second),
		),
	)
	require.NoError(t, err, "start postgres container")

	t.Cleanup(func() {
		_ = container.Terminate(ctx)
	})

	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)

	db, err := sql.Open("pgx", dsn)
	require.NoError(t, err)
	defer db.Close()

	require.NoError(t, goose.SetDialect("postgres"))
	require.NoError(t, goose.Up(db, migrationsDir(t)))

	return dsn
}

func migrationsDir(t *testing.T) string {
	t.Helper()
	_, thisFile, _, ok := runtime.Caller(0)
	require.True(t, ok, "runtime.Caller failed")
	return filepath.Join(filepath.Dir(thisFile), "..", "..", "db", "migrations")
}
