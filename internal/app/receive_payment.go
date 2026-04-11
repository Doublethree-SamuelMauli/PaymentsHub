// Package app holds PaymentsHub application services (use cases). They
// orchestrate domain logic and repositories. They must stay infrastructure-
// agnostic: no HTTP, no direct pgx, no logging framework.
package app

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

// ReceivePaymentInput is the structured request shape the use case consumes.
// Handlers translate HTTP DTOs into this.
type ReceivePaymentInput struct {
	IdempotencyKey string
	ExternalID     string
	Type           payment.Type
	AmountCents    int64
	PayerAccountID uuid.UUID
	BeneficiaryID  *uuid.UUID
	PayeeMethod    payment.PayeeMethod
	Payee          map[string]any
	Description    string
	ScheduledFor   *time.Time
	Actor          string // usually "apikey:<label>"
	RequestHash    string // sha256 of request payload, for idempotency check
}

// ReceivePaymentResult is returned by the use case.
type ReceivePaymentResult struct {
	Payment   *payment.Payment
	Replayed  bool // true when idempotency-cache hit with same hash
	CacheHit  bool // same semantics as Replayed — kept for clarity
	CachedAt  time.Time
}

// ReceivePayment is the application service. It validates input, enforces
// idempotency, persists the payment, and emits the RECEIVED audit event.
type ReceivePayment struct {
	payments     ports.PaymentRepository
	events       ports.PaymentEventRepository
	idempotency  ports.IdempotencyRepository
	payerAccts   ports.PayerAccountRepository
	idemTTL      time.Duration
	clock        func() time.Time
	newUUID      func() uuid.UUID
}

// NewReceivePayment constructs the service with its collaborators.
func NewReceivePayment(
	payments ports.PaymentRepository,
	events ports.PaymentEventRepository,
	idempotency ports.IdempotencyRepository,
	payerAccts ports.PayerAccountRepository,
) *ReceivePayment {
	return &ReceivePayment{
		payments:    payments,
		events:      events,
		idempotency: idempotency,
		payerAccts:  payerAccts,
		idemTTL:     24 * time.Hour,
		clock:       time.Now,
		newUUID:     uuid.New,
	}
}

// ErrIdempotencyMismatch is returned when the same Idempotency-Key is replayed
// with a different request hash.
var ErrIdempotencyMismatch = errors.New("app: idempotency key replayed with different payload")

// Execute runs the use case.
func (uc *ReceivePayment) Execute(ctx context.Context, in ReceivePaymentInput) (*ReceivePaymentResult, error) {
	if err := validateInput(in); err != nil {
		return nil, err
	}

	// Verify payer account exists.
	if _, err := uc.payerAccts.Get(ctx, in.PayerAccountID); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, fmt.Errorf("%w: payer_account_id", domain.ErrInvalidInput)
		}
		return nil, fmt.Errorf("load payer account: %w", err)
	}

	// Idempotency fast path.
	if existing, err := uc.idempotency.Get(ctx, in.IdempotencyKey); err == nil && existing != nil {
		if existing.RequestHash != in.RequestHash {
			return nil, ErrIdempotencyMismatch
		}
		// Cache hit: the original payment still exists.
		orig, err := uc.payments.GetByIdempotencyKey(ctx, in.IdempotencyKey)
		if err != nil {
			return nil, fmt.Errorf("load cached payment: %w", err)
		}
		return &ReceivePaymentResult{
			Payment:  orig,
			Replayed: true,
			CacheHit: true,
			CachedAt: existing.CreatedAt,
		}, nil
	}

	// Build and persist new payment.
	p := payment.New(
		uc.newUUID(),
		in.ExternalID,
		in.Type,
		money.Cents(in.AmountCents),
		in.PayerAccountID,
		in.PayeeMethod,
		in.Payee,
		in.IdempotencyKey,
	)
	p.BeneficiaryID = in.BeneficiaryID
	p.BeneficiarySnapshot = map[string]any{"frozen_at": uc.clock().UTC().Format(time.RFC3339)}
	p.Description = in.Description
	p.ScheduledFor = in.ScheduledFor

	if err := uc.payments.Insert(ctx, p); err != nil {
		return nil, fmt.Errorf("insert payment: %w", err)
	}

	if err := uc.events.Insert(ctx, ports.PaymentEvent{
		ID:        uc.newUUID(),
		PaymentID: p.ID,
		ToStatus:  string(payment.StatusReceived),
		Actor:     in.Actor,
		Reason:    "ingress",
	}); err != nil {
		return nil, fmt.Errorf("insert event: %w", err)
	}

	// Persist idempotency snapshot.
	snap := map[string]any{
		"id":     p.ID.String(),
		"status": string(p.Status),
	}
	snapJSON, _ := json.Marshal(snap)
	_ = snapJSON // consumed only for hashing consistency; the Repo stores the map directly.

	if err := uc.idempotency.Insert(ctx, ports.IdempotencyRecord{
		Key:              in.IdempotencyKey,
		Scope:            "POST /v1/payments",
		RequestHash:      in.RequestHash,
		ResponseSnapshot: snap,
		StatusCode:       201,
		ExpiresAt:        uc.clock().Add(uc.idemTTL),
	}); err != nil {
		return nil, fmt.Errorf("insert idempotency: %w", err)
	}

	return &ReceivePaymentResult{Payment: p, Replayed: false}, nil
}

func validateInput(in ReceivePaymentInput) error {
	if in.IdempotencyKey == "" {
		return fmt.Errorf("%w: idempotency_key required", domain.ErrInvalidInput)
	}
	if in.Type != payment.TypePIX && in.Type != payment.TypeTED {
		return fmt.Errorf("%w: type must be PIX or TED", domain.ErrInvalidInput)
	}
	if in.AmountCents <= 0 {
		return fmt.Errorf("%w: amount_cents must be > 0", domain.ErrInvalidInput)
	}
	if in.PayerAccountID == uuid.Nil {
		return fmt.Errorf("%w: payer_account_id required", domain.ErrInvalidInput)
	}
	if in.PayeeMethod != payment.PayeeMethodPIXKey && in.PayeeMethod != payment.PayeeMethodBankAccount {
		return fmt.Errorf("%w: payee_method invalid", domain.ErrInvalidInput)
	}
	if len(in.Payee) == 0 {
		return fmt.Errorf("%w: payee required", domain.ErrInvalidInput)
	}
	return nil
}

// HashRequestBody returns the canonical sha256 hex of a JSON-marshaled payload,
// used as the idempotency request_hash.
func HashRequestBody(body []byte) string {
	h := sha256.Sum256(body)
	return hex.EncodeToString(h[:])
}
