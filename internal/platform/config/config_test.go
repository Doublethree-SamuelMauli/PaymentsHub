package config_test

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/platform/config"
)

func TestLoad_WithAllRequiredEnvVars(t *testing.T) {
	t.Setenv("PH_ENV", "dev")
	t.Setenv("PH_LOG_LEVEL", "debug")
	t.Setenv("PH_HTTP_ADDR", ":8080")
	t.Setenv("PH_DATABASE_URL", "postgres://localhost/paymentshub?sslmode=disable")
	t.Setenv("PH_SHUTDOWN_TIMEOUT_SECONDS", "15")

	cfg, err := config.Load()
	require.NoError(t, err)
	require.Equal(t, "dev", cfg.Env)
	require.Equal(t, "debug", cfg.LogLevel)
	require.Equal(t, ":8080", cfg.HTTPAddr)
	require.Equal(t, "postgres://localhost/paymentshub?sslmode=disable", cfg.DatabaseURL)
	require.Equal(t, 15, cfg.ShutdownTimeoutSeconds)
}

func TestLoad_FailsWhenDatabaseURLMissing(t *testing.T) {
	os.Unsetenv("PH_DATABASE_URL")
	_, err := config.Load()
	require.Error(t, err)
}

func TestLoad_AppliesDefaultsForOptionalFields(t *testing.T) {
	t.Setenv("PH_DATABASE_URL", "postgres://localhost/paymentshub?sslmode=disable")
	t.Setenv("PH_ENV", "dev")

	cfg, err := config.Load()
	require.NoError(t, err)
	require.Equal(t, "info", cfg.LogLevel)
	require.Equal(t, ":8080", cfg.HTTPAddr)
	require.Equal(t, 30, cfg.ShutdownTimeoutSeconds)
}
