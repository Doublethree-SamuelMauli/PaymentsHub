// Package rest is the Itaú Cash Management REST adapter.
//
// It is driven behind a PaymentGateway interface declared in internal/app/ports.
// Transport-level concerns (OAuth2, mTLS, retry, circuit breaker) live here.
// Tests mock the transport with an httptest.Server.
package rest

import "errors"

// Typed errors callers can inspect with errors.Is.
var (
	ErrAuthFailed       = errors.New("itau rest: auth failed")
	ErrRejectedByBank   = errors.New("itau rest: rejected by bank")
	ErrBankUnavailable  = errors.New("itau rest: bank unavailable")
	ErrCircuitOpen      = errors.New("itau rest: circuit breaker open")
	ErrRateLimited      = errors.New("itau rest: rate limited")
	ErrUnexpectedStatus = errors.New("itau rest: unexpected http status")
	ErrBadResponse      = errors.New("itau rest: malformed response")
)
