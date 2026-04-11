package http

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// RouterDeps is the dependency bundle NewRouter needs.
// It grows in later plans (DB, use cases, auth middleware...).
type RouterDeps struct {
	Logger          *slog.Logger
	ReadinessChecks []ReadinessCheck
	RequestTimeout  time.Duration
}

// NewRouter builds the chi router with the middleware stack and all routes.
func NewRouter(deps RouterDeps) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	if deps.RequestTimeout > 0 {
		r.Use(middleware.Timeout(deps.RequestTimeout))
	}

	health := NewHealthHandlers(deps.ReadinessChecks...)
	r.Get("/healthz", health.Livez)
	r.Get("/readyz", health.Readyz)

	return r
}
