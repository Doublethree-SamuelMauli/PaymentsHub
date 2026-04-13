package middleware

import (
	"context"
	"net/http"
	"strconv"
	"time"

	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus"

	"github.com/vanlink-ltda/paymentshub/internal/platform/metrics"
)

type corrKeyT int

const corrKey corrKeyT = 0

// CorrelationID reads X-Correlation-ID from the request or generates a new one,
// sets it on the response header, and injects it into the context.
func CorrelationID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cid := r.Header.Get("X-Correlation-ID")
		if cid == "" {
			cid = uuid.New().String()
		}
		w.Header().Set("X-Correlation-ID", cid)
		ctx := context.WithValue(r.Context(), corrKey, cid)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// CorrelationIDFromContext extracts the correlation id.
func CorrelationIDFromContext(ctx context.Context) string {
	v, _ := ctx.Value(corrKey).(string)
	return v
}

// PrometheusMetrics records request duration and total count.
func PrometheusMetrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := chimw.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)
		duration := time.Since(start).Seconds()
		status := strconv.Itoa(ww.Status())
		path := r.URL.Path

		metrics.HTTPRequestDuration.With(prometheus.Labels{
			"method": r.Method, "path": path, "status": status,
		}).Observe(duration)
		metrics.HTTPRequestsTotal.With(prometheus.Labels{
			"method": r.Method, "path": path, "status": status,
		}).Inc()
	})
}
