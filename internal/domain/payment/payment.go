package payment

import (
	"time"

	"github.com/google/uuid"

	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
)

// Type is the payment channel discriminator.
type Type string

const (
	TypePIX Type = "PIX"
	TypeTED Type = "TED"
)

// PayeeMethod discriminates the "how we identify the destination".
type PayeeMethod string

const (
	PayeeMethodPIXKey      PayeeMethod = "PIX_KEY"
	PayeeMethodBankAccount PayeeMethod = "BANK_ACCOUNT"
)

// Payment is the in-memory representation of a payment order.
// The database row maps 1-1 to this struct through the repository layer.
type Payment struct {
	ID                  uuid.UUID
	ExternalID          string
	Type                Type
	Status              Status
	Amount              money.Cents
	Currency            string
	PayerAccountID      uuid.UUID
	BeneficiaryID       *uuid.UUID
	BeneficiarySnapshot map[string]any
	PayeeMethod         PayeeMethod
	Payee               map[string]any
	Description         string
	ScheduledFor        *time.Time
	IdempotencyKey      string
	BankReference       string
	RejectionReason     string
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

// New creates a Payment pinned to StatusReceived. Caller is responsible for
// supplying a fresh uuid and non-zero times.
func New(
	id uuid.UUID,
	externalID string,
	typ Type,
	amount money.Cents,
	payerAccountID uuid.UUID,
	payeeMethod PayeeMethod,
	payee map[string]any,
	idempotencyKey string,
) *Payment {
	return &Payment{
		ID:             id,
		ExternalID:     externalID,
		Type:           typ,
		Status:         StatusReceived,
		Amount:         amount,
		Currency:       "BRL",
		PayerAccountID: payerAccountID,
		PayeeMethod:    payeeMethod,
		Payee:          payee,
		IdempotencyKey: idempotencyKey,
	}
}

// ApplyTransition mutates p.Status after validating the transition is legal.
// Callers should persist the event in payment_events on success.
func (p *Payment) ApplyTransition(to Status) error {
	if err := Transition(p.Status, to); err != nil {
		return err
	}
	p.Status = to
	return nil
}
