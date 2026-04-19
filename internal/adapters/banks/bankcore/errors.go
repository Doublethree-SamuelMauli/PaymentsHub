// Package bankcore provides the shared HTTP/OAuth plumbing used by every
// bank REST adapter (Bradesco, Inter, Santander, BB, Sicoob, BTG).
//
// Itaú keeps its own dedicated client at internal/adapters/banks/itau/rest
// because its retry and mTLS behaviour predated this refactor; new adapters
// should not duplicate that code — they compose bankcore.Client instead.
package bankcore

import "errors"

var (
	ErrAuth        = errors.New("bankcore: oauth failure")
	ErrRejected    = errors.New("bankcore: rejected by bank (4xx)")
	ErrUnavailable = errors.New("bankcore: bank unavailable (5xx)")
	ErrRateLimited = errors.New("bankcore: rate limited")
	ErrCircuit     = errors.New("bankcore: circuit breaker open")
	ErrBadResponse = errors.New("bankcore: malformed response")
)
