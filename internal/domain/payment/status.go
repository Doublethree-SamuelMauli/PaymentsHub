package payment

import (
	"fmt"

	"github.com/vanlink-ltda/paymentshub/internal/domain"
)

// Status is the lifecycle state of a Payment.
//
// See docs/superpowers/specs/2026-04-11-phase1-core-itau-design.md §3.2
// for the full state diagram. Transitions are enforced by the Transition
// function below.
type Status string

const (
	StatusReceived       Status = "RECEIVED"
	StatusValidatedLocal Status = "VALIDATED_LOCAL"
	StatusUnderReview    Status = "UNDER_REVIEW"
	StatusPrevalidated   Status = "PREVALIDATED"
	StatusApproved       Status = "APPROVED"
	StatusOnHold         Status = "ON_HOLD"
	StatusSubmitting     Status = "SUBMITTING"
	StatusSent           Status = "SENT"
	StatusSettled        Status = "SETTLED"
	StatusFailed         Status = "FAILED"
	StatusRejected       Status = "REJECTED"
	StatusCanceled       Status = "CANCELED"
	StatusExpired        Status = "EXPIRED"
)

// AllStatuses returns every status value in declaration order.
func AllStatuses() []Status {
	return []Status{
		StatusReceived, StatusValidatedLocal, StatusUnderReview, StatusPrevalidated,
		StatusApproved, StatusOnHold, StatusSubmitting, StatusSent, StatusSettled,
		StatusFailed, StatusRejected, StatusCanceled, StatusExpired,
	}
}

// IsTerminal reports whether a status has no outgoing transitions in normal flow.
func (s Status) IsTerminal() bool {
	switch s {
	case StatusSettled, StatusRejected, StatusCanceled, StatusExpired:
		return true
	}
	return false
}

// String satisfies fmt.Stringer.
func (s Status) String() string { return string(s) }

// allowed is the canonical transition table. Each key is the origin status;
// the value is the set of legal destinations.
var allowed = map[Status]map[Status]struct{}{
	StatusReceived: {
		StatusValidatedLocal: {},
		StatusRejected:       {},
		StatusCanceled:       {},
	},
	StatusValidatedLocal: {
		StatusUnderReview: {},
		StatusPrevalidated: {},
		StatusRejected:     {},
		StatusCanceled:     {},
	},
	StatusUnderReview: {
		StatusValidatedLocal: {},
		StatusRejected:       {},
		StatusCanceled:       {},
	},
	StatusPrevalidated: {
		StatusApproved: {},
		StatusRejected: {},
		StatusCanceled: {},
		StatusExpired:  {},
	},
	StatusApproved: {
		StatusSubmitting: {},
		StatusOnHold:     {},
		StatusCanceled:   {},
		StatusExpired:    {},
	},
	StatusOnHold: {
		StatusApproved: {},
		StatusCanceled: {},
	},
	StatusSubmitting: {
		StatusSubmitting: {},
		StatusSent:       {},
		StatusFailed:     {},
	},
	StatusSent: {
		StatusSettled: {},
		StatusFailed:  {},
	},
	// FAILED is usually terminal, but operators can manually reopen a DLQ-ed
	// payment by calling POST /v1/payments/:id/retry, which moves it back to
	// SUBMITTING. This is the single documented exception.
	StatusFailed: {
		StatusSubmitting: {},
	},
}

// CanTransition reports whether `from -> to` is legal.
func CanTransition(from, to Status) bool {
	dests, ok := allowed[from]
	if !ok {
		return false
	}
	_, allowedDest := dests[to]
	return allowedDest
}

// Transition validates that `from -> to` is legal and returns ErrIllegalTransition
// wrapped with context if not.
func Transition(from, to Status) error {
	if !CanTransition(from, to) {
		return fmt.Errorf("%w: %s -> %s", domain.ErrIllegalTransition, from, to)
	}
	return nil
}
