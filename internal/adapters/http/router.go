package http

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/http/handlers"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
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
}

// NewRouter builds the chi router with the middleware stack and all routes.
func NewRouter(deps RouterDeps) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	if deps.RequestTimeout > 0 {
		r.Use(chimw.Timeout(deps.RequestTimeout))
	}

	health := NewHealthHandlers(deps.ReadinessChecks...)
	r.Get("/healthz", health.Livez)
	r.Get("/readyz", health.Readyz)

	// Authenticated routes
	r.Group(func(r chi.Router) {
		if deps.APIKeys != nil {
			r.Use(middleware.APIKeyAuth(deps.APIKeys))
		}
		if deps.Payments != nil {
			deps.Payments.Register(r)
		}
	})

	return r
}
