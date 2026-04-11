// Package run models a PaymentRun — the daily "lote" that aggregates
// approved payments (PIX + TED) for human approval and execution.
package run

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/vanlink-ltda/paymentshub/internal/domain"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
)

type Status string

const (
	StatusOpen             Status = "OPEN"
	StatusApproved         Status = "APPROVED"
	StatusExecuting        Status = "EXECUTING"
	StatusPartiallySettled Status = "PARTIALLY_SETTLED"
	StatusClosed           Status = "CLOSED"
	StatusFailed           Status = "FAILED"
)

func (s Status) IsTerminal() bool {
	return s == StatusClosed || s == StatusFailed
}

func (s Status) String() string { return string(s) }

// Channel is the execution route chosen for a run item.
type Channel string

const (
	ChannelPIXRest Channel = "PIX_REST"
	ChannelCNABTed Channel = "CNAB_TED"
)

var allowed = map[Status]map[Status]struct{}{
	StatusOpen:             {StatusApproved: {}, StatusClosed: {}},
	StatusApproved:         {StatusExecuting: {}, StatusFailed: {}},
	StatusExecuting:        {StatusPartiallySettled: {}, StatusClosed: {}, StatusFailed: {}},
	StatusPartiallySettled: {StatusClosed: {}, StatusFailed: {}},
}

// CanTransition reports whether `from -> to` is legal for a PaymentRun.
func CanTransition(from, to Status) bool {
	dests, ok := allowed[from]
	if !ok {
		return false
	}
	_, ok = dests[to]
	return ok
}

// Transition validates the transition and returns ErrIllegalTransition if not legal.
func Transition(from, to Status) error {
	if !CanTransition(from, to) {
		return fmt.Errorf("%w: %s -> %s", domain.ErrIllegalTransition, from, to)
	}
	return nil
}

// Run is the aggregate root of a daily payment run.
type Run struct {
	ID               uuid.UUID
	RunDate          time.Time
	Status           Status
	ApprovedAt       *time.Time
	ApprovedBy       string
	TotalItems       int
	TotalAmount      money.Cents
	PixCount         int
	TedCount         int
	Summary          map[string]any
	CreatedAt        time.Time
	ClosedAt         *time.Time
}

// New creates a fresh Run in StatusOpen for a given date.
func New(id uuid.UUID, runDate time.Time) *Run {
	return &Run{
		ID:      id,
		RunDate: runDate,
		Status:  StatusOpen,
	}
}

// ApplyTransition mutates the in-memory Status if the target transition is legal.
func (r *Run) ApplyTransition(to Status) error {
	if err := Transition(r.Status, to); err != nil {
		return err
	}
	r.Status = to
	return nil
}
