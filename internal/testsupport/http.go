package testsupport

import (
	nethttp "net/http"
	"net/http/httptest"
	"testing"
	"time"

	httpadapter "github.com/vanlink-ltda/paymentshub/internal/adapters/http"
	"github.com/vanlink-ltda/paymentshub/internal/platform/logging"
)

// SpawnAPI boots the PaymentsHub HTTP router in-process using httptest.Server
// and returns the base URL plus the underlying server so tests can close it.
// This does NOT open Postgres connections — it only exercises HTTP plumbing.
//
// Plan 02 introduces a variant that wires a real DB pool.
func SpawnAPI(t *testing.T) (baseURL string, cleanup func()) {
	t.Helper()
	logger := logging.NewLogger(logging.Options{
		Env:     "test",
		Level:   "error",
		Service: "paymentshub-api",
	})

	router := httpadapter.NewRouter(httpadapter.RouterDeps{
		Logger:         logger,
		RequestTimeout: 5 * time.Second,
	})

	srv := httptest.NewServer(router)

	cleanup = func() {
		srv.Close()
	}

	return srv.URL, cleanup
}

// HTTPClient returns a default *nethttp.Client with a reasonable timeout for tests.
func HTTPClient() *nethttp.Client {
	return &nethttp.Client{Timeout: 10 * time.Second}
}
