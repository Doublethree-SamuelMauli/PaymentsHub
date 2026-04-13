package testsupport

import (
	"context"
	nethttp "net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/repositories"
	httpadapter "github.com/vanlink-ltda/paymentshub/internal/adapters/http"
	"log/slog"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/http/handlers"
	"github.com/vanlink-ltda/paymentshub/internal/app"
	"github.com/vanlink-ltda/paymentshub/internal/platform/logging"
)

// API bundles the httptest server with the repositories it wires, so tests can
// both drive HTTP calls and seed/verify DB state.
type API struct {
	BaseURL       string
	Pool          *pgxpool.Pool
	Payments      *repositories.PaymentRepository
	Events        *repositories.PaymentEventRepository
	Idempotency   *repositories.IdempotencyRepository
	APIKeys       *repositories.APIKeyRepository
	Beneficiaries *repositories.BeneficiaryRepository
	PayerAccounts *repositories.PayerAccountRepository
	Runs          *repositories.RunRepository
	Clients       *repositories.ClientRepository
	cleanup       func()
}

// Close tears down the httptest server and underlying pool.
func (a *API) Close() {
	a.cleanup()
}

// SpawnAPIWithDB boots a fresh Postgres container, a pgxpool, wires every
// repository and application service, and exposes the full HTTP router via
// httptest. Cleanup is registered on the test.
func SpawnAPIWithDB(t *testing.T) *API {
	t.Helper()
	dsn := SpawnPostgres(t)
	pool := OpenPool(t, dsn)

	payments := repositories.NewPaymentRepository(pool)
	events := repositories.NewPaymentEventRepository(pool)
	idem := repositories.NewIdempotencyRepository(pool)
	apiKeys := repositories.NewAPIKeyRepository(pool)
	beneficiaries := repositories.NewBeneficiaryRepository(pool)
	payerAccts := repositories.NewPayerAccountRepository(pool)
	runsRepo := repositories.NewRunRepository(pool)
	clients := repositories.NewClientRepository(pool)

	receive := app.NewReceivePayment(payments, events, idem, payerAccts)
	runService := app.NewRunService(runsRepo, payments, events)

	logger := logging.NewLogger(logging.Options{
		Env: "test", Level: "error", Service: "paymentshub-api",
	})

	router := httpadapter.NewRouter(httpadapter.RouterDeps{
		Logger:         logger,
		APIKeys:        apiKeys,
		Payments:       handlers.NewPaymentsHandler(receive, payments, events),
		Runs:           handlers.NewRunsHandler(runService, pool),
		Admin:          handlers.NewAdminHandler(payerAccts, beneficiaries, apiKeys, clients, pool),
		Webhooks:       handlers.NewWebhookHandler(payments, events, slog.New(logger.Handler())),
		RequestTimeout: 5 * time.Second,
		ReadinessChecks: []httpadapter.ReadinessCheck{
			func(r *nethttp.Request) error {
				ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
				defer cancel()
				return pool.Ping(ctx)
			},
		},
	})

	srv := httptest.NewServer(router)
	t.Cleanup(srv.Close)

	api := &API{
		BaseURL:       srv.URL,
		Pool:          pool,
		Payments:      payments,
		Events:        events,
		Idempotency:   idem,
		APIKeys:       apiKeys,
		Beneficiaries: beneficiaries,
		PayerAccounts: payerAccts,
		Runs:          runsRepo,
		Clients:       clients,
		cleanup:       srv.Close,
	}
	require.NotEmpty(t, api.BaseURL)
	return api
}
