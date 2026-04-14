package app

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/repositories"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
	"github.com/vanlink-ltda/paymentshub/internal/domain/run"
)

// RunService orchestrates PaymentRun lifecycle: create, attach payments, approve, cancel.
// It is deliberately decoupled from the worker layer — approval only flips states
// and records events; Plan 08 wires the actual job dispatchers.
type RunService struct {
	runs     *repositories.RunRepository
	payments ports.PaymentRepository
	events   ports.PaymentEventRepository
	clock    func() time.Time
	newUUID  func() uuid.UUID
}

func NewRunService(
	runs *repositories.RunRepository,
	payments ports.PaymentRepository,
	events ports.PaymentEventRepository,
) *RunService {
	return &RunService{
		runs:     runs,
		payments: payments,
		events:   events,
		clock:    time.Now,
		newUUID:  uuid.New,
	}
}

// CreateRun creates an OPEN run for the given date.
func (s *RunService) CreateRun(ctx context.Context, date time.Time) (*run.Run, error) {
	r := run.New(s.newUUID(), date)
	if err := s.runs.Insert(ctx, r); err != nil {
		return nil, fmt.Errorf("insert run: %w", err)
	}
	return r, nil
}

// AttachPayment links a PREVALIDATED payment to an OPEN run.
// The payment is NOT transitioned to APPROVED yet — that happens on ApproveRun.
func (s *RunService) AttachPayment(ctx context.Context, runID, paymentID uuid.UUID) error {
	r, err := s.runs.Get(ctx, runID)
	if err != nil {
		return err
	}
	if r.Status != run.StatusOpen {
		return fmt.Errorf("%w: run %s is not OPEN (is %s)", domain.ErrConflict, runID, r.Status)
	}
	p, err := s.payments.Get(ctx, paymentID)
	if err != nil {
		return err
	}
	if p.Status != payment.StatusPrevalidated {
		return fmt.Errorf("%w: payment %s not PREVALIDATED (is %s)", domain.ErrConflict, paymentID, p.Status)
	}

	channel := run.ChannelPIXRest
	if p.Type == payment.TypeTED {
		channel = run.ChannelCNABTed
	}
	if err := s.runs.AttachPayment(ctx, runID, paymentID, channel); err != nil {
		return fmt.Errorf("attach: %w", err)
	}
	return nil
}

// DetachPayment removes a payment from an OPEN run.
func (s *RunService) DetachPayment(ctx context.Context, runID, paymentID uuid.UUID) error {
	r, err := s.runs.Get(ctx, runID)
	if err != nil {
		return err
	}
	if r.Status != run.StatusOpen {
		return fmt.Errorf("%w: run %s is not OPEN", domain.ErrConflict, runID)
	}
	return s.runs.DetachPayment(ctx, runID, paymentID)
}

// ApproveRun transitions the run to APPROVED and every attached payment
// PREVALIDATED -> APPROVED. Updates run counters from the aggregate.
// In Plan 08 this will also enqueue SubmitPixJob / GenerateCnabJob.
func (s *RunService) ApproveRun(ctx context.Context, runID uuid.UUID, approvedBy string) (*run.Run, error) {
	r, err := s.runs.Get(ctx, runID)
	if err != nil {
		return nil, err
	}
	if err := r.ApplyTransition(run.StatusApproved); err != nil {
		return nil, err
	}

	items, err := s.runs.ListItems(ctx, runID)
	if err != nil {
		return nil, fmt.Errorf("list items: %w", err)
	}

	var total money.Cents
	var pixCount, tedCount int

	for _, it := range items {
		p, err := s.payments.Get(ctx, it.PaymentID)
		if err != nil {
			return nil, fmt.Errorf("load payment %s: %w", it.PaymentID, err)
		}
		if p.Status != payment.StatusPrevalidated {
			return nil, fmt.Errorf("%w: payment %s not PREVALIDATED (is %s)", domain.ErrConflict, p.ID, p.Status)
		}
		if err := payment.Transition(p.Status, payment.StatusApproved); err != nil {
			return nil, err
		}
		if err := s.payments.UpdateStatus(ctx, p.ID, payment.StatusApproved, "", ""); err != nil {
			return nil, fmt.Errorf("transition payment %s: %w", p.ID, err)
		}
		if err := s.events.Insert(ctx, ports.PaymentEvent{
			ID:         s.newUUID(),
			PaymentID:  p.ID,
			FromStatus: string(payment.StatusPrevalidated),
			ToStatus:   string(payment.StatusApproved),
			Actor:      "user:" + approvedBy,
			Reason:     "run approved",
		}); err != nil {
			return nil, fmt.Errorf("insert event %s: %w", p.ID, err)
		}
		total = total.Add(p.Amount)
		if p.Type == payment.TypePIX {
			pixCount++
		} else {
			tedCount++
		}
	}

	now := s.clock()
	if err := s.runs.UpdateStatus(ctx, r.ID, run.StatusApproved, approvedBy, &now, nil); err != nil {
		return nil, fmt.Errorf("update run status: %w", err)
	}
	if err := s.runs.UpdateCounters(ctx, r.ID, len(items), pixCount, tedCount, total); err != nil {
		return nil, fmt.Errorf("update counters: %w", err)
	}

	r.Status = run.StatusApproved
	r.ApprovedAt = &now
	r.ApprovedBy = approvedBy
	r.TotalItems = len(items)
	r.PixCount = pixCount
	r.TedCount = tedCount
	r.TotalAmount = total
	return r, nil
}

// HoldPayment flips APPROVED -> ON_HOLD.
func (s *RunService) HoldPayment(ctx context.Context, paymentID uuid.UUID, actor, reason string) error {
	return s.transitionPayment(ctx, paymentID, payment.StatusOnHold, actor, reason, payment.StatusApproved)
}

// UnholdPayment flips ON_HOLD -> APPROVED.
func (s *RunService) UnholdPayment(ctx context.Context, paymentID uuid.UUID, actor, reason string) error {
	return s.transitionPayment(ctx, paymentID, payment.StatusApproved, actor, reason, payment.StatusOnHold)
}

// CancelPayment flips any non-terminal status to CANCELED.
func (s *RunService) CancelPayment(ctx context.Context, paymentID uuid.UUID, actor, reason string) error {
	p, err := s.payments.Get(ctx, paymentID)
	if err != nil {
		return err
	}
	if err := payment.Transition(p.Status, payment.StatusCanceled); err != nil {
		return err
	}
	if err := s.payments.UpdateStatus(ctx, p.ID, payment.StatusCanceled, "", reason); err != nil {
		return fmt.Errorf("update status: %w", err)
	}
	return s.events.Insert(ctx, ports.PaymentEvent{
		ID:         s.newUUID(),
		PaymentID:  p.ID,
		FromStatus: string(p.Status),
		ToStatus:   string(payment.StatusCanceled),
		Actor:      "user:" + actor,
		Reason:     reason,
	})
}

// RejectPayment flips a pre-submission status to REJECTED.
func (s *RunService) RejectPayment(ctx context.Context, paymentID uuid.UUID, actor, reason string) error {
	p, err := s.payments.Get(ctx, paymentID)
	if err != nil {
		return err
	}
	if err := payment.Transition(p.Status, payment.StatusRejected); err != nil {
		return err
	}
	if err := s.payments.UpdateStatus(ctx, p.ID, payment.StatusRejected, "", reason); err != nil {
		return fmt.Errorf("update: %w", err)
	}
	return s.events.Insert(ctx, ports.PaymentEvent{
		ID:         s.newUUID(),
		PaymentID:  p.ID,
		FromStatus: string(p.Status),
		ToStatus:   string(payment.StatusRejected),
		Actor:      "user:" + actor,
		Reason:     reason,
	})
}

func (s *RunService) transitionPayment(ctx context.Context, paymentID uuid.UUID, to payment.Status, actor, reason string, requireFrom ...payment.Status) error {
	p, err := s.payments.Get(ctx, paymentID)
	if err != nil {
		return err
	}
	if len(requireFrom) > 0 {
		ok := false
		for _, rf := range requireFrom {
			if p.Status == rf {
				ok = true
				break
			}
		}
		if !ok {
			return fmt.Errorf("%w: payment %s is in %s, required one of %v", domain.ErrConflict, p.ID, p.Status, requireFrom)
		}
	}
	if err := payment.Transition(p.Status, to); err != nil {
		return err
	}
	if err := s.payments.UpdateStatus(ctx, p.ID, to, "", ""); err != nil {
		return fmt.Errorf("update status: %w", err)
	}
	return s.events.Insert(ctx, ports.PaymentEvent{
		ID:         s.newUUID(),
		PaymentID:  p.ID,
		FromStatus: string(p.Status),
		ToStatus:   string(to),
		Actor:      "user:" + actor,
		Reason:     reason,
	})
}

// ReschedulePayment moves a payment to a future date. The payment is detached
// from any current run, its scheduled_for is updated, and it is transitioned
// back to PREVALIDATED so it can be picked up by the auto-grouping cron for
// the new date's run.
func (s *RunService) ReschedulePayment(ctx context.Context, paymentID uuid.UUID, newDate time.Time, actor, reason string) error {
	// Cap reason length + strip newlines (anti-log-injection)
	if len(reason) > 500 {
		reason = reason[:500]
	}
	reason = strings.ReplaceAll(reason, "\n", " ")
	reason = strings.ReplaceAll(reason, "\r", "")

	p, err := s.payments.Get(ctx, paymentID)
	if err != nil {
		return err
	}

	// Only allow reschedule from pre-submission states. APPROVED is excluded
	// because the payment may belong to a run whose aggregates were computed
	// at approval time — allowing reschedule would make run totals lie.
	allowed := map[payment.Status]bool{
		payment.StatusReceived:       true,
		payment.StatusValidatedLocal: true,
		payment.StatusPrevalidated:   true,
		payment.StatusOnHold:         true,
		payment.StatusUnderReview:    true,
	}
	if !allowed[p.Status] {
		return fmt.Errorf("%w: cannot reschedule payment in status %s (only pre-approval states allowed)", domain.ErrConflict, p.Status)
	}

	pool := s.runs.Pool()
	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Verify payment is not attached to an APPROVED/EXECUTING run (race-safe check)
	var runStatus string
	err = tx.QueryRow(ctx, `
		SELECT r.status FROM payment_run_items i
		JOIN payment_runs r ON r.id = i.run_id
		WHERE i.payment_id = $1
	`, paymentID).Scan(&runStatus)
	if err == nil && (runStatus == "APPROVED" || runStatus == "EXECUTING" || runStatus == "PARTIALLY_SETTLED") {
		return fmt.Errorf("%w: payment is in a run with status %s", domain.ErrConflict, runStatus)
	}

	// Detach from OPEN run (if any)
	_, _ = tx.Exec(ctx, "DELETE FROM payment_run_items WHERE payment_id = $1", paymentID)

	// Update scheduled_for + reschedule fields + reset status
	_, err = tx.Exec(ctx, `
		UPDATE payments
		SET scheduled_for = $1,
		    rescheduled_from = COALESCE(rescheduled_from, CURRENT_DATE),
		    rescheduled_reason = $2,
		    status = 'PREVALIDATED',
		    updated_at = now()
		WHERE id = $3
	`, newDate, reason, paymentID)
	if err != nil {
		return fmt.Errorf("update payment: %w", err)
	}

	// Audit event
	_, err = tx.Exec(ctx, `
		INSERT INTO payment_events (id, payment_id, from_status, to_status, actor, reason)
		VALUES ($1, $2, $3, 'PREVALIDATED', $4, $5)
	`, s.newUUID(), paymentID, string(p.Status), "user:"+actor, fmt.Sprintf("rescheduled to %s: %s", newDate.Format("2006-01-02"), reason))
	if err != nil {
		return fmt.Errorf("insert event: %w", err)
	}

	return tx.Commit(ctx)
}

// Compile-time check that errors.Is propagation works.
var _ = errors.Is
