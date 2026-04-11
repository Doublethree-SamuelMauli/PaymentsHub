// Package domain holds pure-Go entities and state machines for PaymentsHub.
//
// Nothing in this package depends on a database, HTTP, logging, or any
// infrastructure — it exists so business rules can be reasoned about and
// tested in isolation.
package domain

import "errors"

// Sentinel errors raised by the domain layer.
var (
	ErrNotFound          = errors.New("domain: not found")
	ErrConflict          = errors.New("domain: conflict")
	ErrIllegalTransition = errors.New("domain: illegal state transition")
	ErrAlreadyTerminal   = errors.New("domain: entity already in terminal state")
	ErrInvalidInput      = errors.New("domain: invalid input")
)
