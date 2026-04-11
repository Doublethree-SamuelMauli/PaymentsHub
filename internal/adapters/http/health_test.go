package http_test

import (
	"encoding/json"
	"io"
	nethttp "net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"

	httpadapter "github.com/vanlink-ltda/paymentshub/internal/adapters/http"
	"github.com/vanlink-ltda/paymentshub/internal/platform/logging"
)

func newTestRouter(t *testing.T) nethttp.Handler {
	t.Helper()
	logger := logging.NewLogger(logging.Options{
		Env:     "test",
		Level:   "error",
		Service: "paymentshub-api",
	})
	return httpadapter.NewRouter(httpadapter.RouterDeps{
		Logger: logger,
	})
}

func TestHealthz_Returns200AndOK(t *testing.T) {
	router := newTestRouter(t)

	req := httptest.NewRequest(nethttp.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	require.Equal(t, nethttp.StatusOK, rec.Code)
	body, err := io.ReadAll(rec.Body)
	require.NoError(t, err)

	var payload map[string]any
	require.NoError(t, json.Unmarshal(body, &payload))
	require.Equal(t, "ok", payload["status"])
}

func TestReadyz_Returns200WhenNoChecksConfigured(t *testing.T) {
	router := newTestRouter(t)

	req := httptest.NewRequest(nethttp.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	require.Equal(t, nethttp.StatusOK, rec.Code)
}

func TestUnknownRoute_Returns404(t *testing.T) {
	router := newTestRouter(t)

	req := httptest.NewRequest(nethttp.MethodGet, "/nope", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	require.Equal(t, nethttp.StatusNotFound, rec.Code)
}
