// Package metrics defines Prometheus metrics for PaymentsHub.
package metrics

import "github.com/prometheus/client_golang/prometheus"

var (
	PaymentsTotal = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "paymentshub",
		Name:      "payments_total",
		Help:      "Total payments by type and status",
	}, []string{"type", "status"})

	PaymentTransitions = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "paymentshub",
		Name:      "payment_transitions_total",
		Help:      "Payment state transitions",
	}, []string{"from", "to"})

	ExternalCallDuration = prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "paymentshub",
		Name:      "external_call_duration_seconds",
		Help:      "Latency of external bank API calls",
		Buckets:   prometheus.DefBuckets,
	}, []string{"bank", "operation", "outcome"})

	HTTPRequestDuration = prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "paymentshub",
		Name:      "http_request_duration_seconds",
		Help:      "HTTP request latency",
		Buckets:   prometheus.DefBuckets,
	}, []string{"method", "path", "status"})

	HTTPRequestsTotal = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "paymentshub",
		Name:      "http_requests_total",
		Help:      "Total HTTP requests",
	}, []string{"method", "path", "status"})

	RiverJobsGauge = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: "paymentshub",
		Name:      "river_jobs",
		Help:      "River job queue gauge by kind and state",
	}, []string{"kind", "state"})
)

func init() {
	prometheus.MustRegister(
		PaymentsTotal,
		PaymentTransitions,
		ExternalCallDuration,
		HTTPRequestDuration,
		HTTPRequestsTotal,
		RiverJobsGauge,
	)
}
