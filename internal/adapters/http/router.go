package http

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/http/handlers"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"

	_ "github.com/vanlink-ltda/paymentshub/internal/platform/metrics"
)

// RouterDeps is the dependency bundle NewRouter needs.
type RouterDeps struct {
	Logger          *slog.Logger
	ReadinessChecks []ReadinessCheck
	RequestTimeout  time.Duration

	// Authentication + authorization
	APIKeys middleware.APIKeyLookup

	// Handlers (nil means the route is not mounted — useful in HTTP-only tests
	// that do not want to spin up DB-backed handlers).
	Payments *handlers.PaymentsHandler
	Runs     *handlers.RunsHandler
	Admin    *handlers.AdminHandler
	Webhooks *handlers.WebhookHandler
}

// NewRouter builds the chi router with the middleware stack and all routes.
func NewRouter(deps RouterDeps) http.Handler {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:*", "http://127.0.0.1:*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "Idempotency-Key", "X-Correlation-ID"},
		ExposedHeaders:   []string{"X-Correlation-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(middleware.CorrelationID)
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(middleware.PrometheusMetrics)
	if deps.RequestTimeout > 0 {
		r.Use(chimw.Timeout(deps.RequestTimeout))
	}

	health := NewHealthHandlers(deps.ReadinessChecks...)
	r.Get("/healthz", health.Livez)
	r.Get("/readyz", health.Readyz)
	r.Handle("/metrics", promhttp.Handler())

	// OpenAPI spec + Swagger UI (publico, sem auth)
	openapi := handlers.NewOpenAPIHandler()
	r.Get("/openapi.json", openapi.Spec)
	r.Get("/docs", openapi.SwaggerUI)

	// Authenticated routes
	r.Group(func(r chi.Router) {
		if deps.APIKeys != nil {
			r.Use(middleware.APIKeyAuth(deps.APIKeys))
		}
		if deps.Payments != nil {
			deps.Payments.Register(r)
		}
		if deps.Runs != nil {
			deps.Runs.Register(r)
		}
		if deps.Admin != nil {
			deps.Admin.Register(r)
		}
	})

	// Webhook routes — NOT behind API key auth (use signature validation).
	if deps.Webhooks != nil {
		deps.Webhooks.Register(r)
	}

	return r
}
