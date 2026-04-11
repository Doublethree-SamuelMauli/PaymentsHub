package http

import (
	"encoding/json"
	"net/http"
)

// ReadinessCheck is a function that returns nil when the dependency is healthy.
// Plan 02 wires a Postgres check here; Plan 07 wires an SFTP check.
type ReadinessCheck func(r *http.Request) error

// HealthHandlers holds the liveness and readiness HTTP handlers.
type HealthHandlers struct {
	readiness []ReadinessCheck
}

// NewHealthHandlers builds handlers from zero or more readiness checks.
func NewHealthHandlers(checks ...ReadinessCheck) *HealthHandlers {
	return &HealthHandlers{readiness: checks}
}

// Livez answers /healthz. It never fails — liveness only cares that the process runs.
func (h *HealthHandlers) Livez(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// Readyz answers /readyz. It runs every configured check sequentially and returns
// 503 with a breakdown on the first failure.
func (h *HealthHandlers) Readyz(w http.ResponseWriter, r *http.Request) {
	for _, check := range h.readiness {
		if err := check(r); err != nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{
				"status": "unready",
				"error":  err.Error(),
			})
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func writeJSON(w http.ResponseWriter, code int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(body)
}
