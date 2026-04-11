//go:build integration

package integration_test

import (
	"encoding/json"
	"io"
	nethttp "net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/testsupport"
)

func TestIntegration_Healthz(t *testing.T) {
	baseURL, cleanup := testsupport.SpawnAPI(t)
	defer cleanup()

	client := testsupport.HTTPClient()
	resp, err := client.Get(baseURL + "/healthz")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, nethttp.StatusOK, resp.StatusCode)
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	var payload map[string]string
	require.NoError(t, json.Unmarshal(body, &payload))
	require.Equal(t, "ok", payload["status"])
}

func TestIntegration_Readyz(t *testing.T) {
	baseURL, cleanup := testsupport.SpawnAPI(t)
	defer cleanup()

	client := testsupport.HTTPClient()
	resp, err := client.Get(baseURL + "/readyz")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, nethttp.StatusOK, resp.StatusCode)
}

func TestIntegration_PostgresSpawn(t *testing.T) {
	dsn := testsupport.SpawnPostgres(t)
	require.NotEmpty(t, dsn)
}
