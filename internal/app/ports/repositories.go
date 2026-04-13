// Package ports declares the interfaces the application layer uses to reach
// adapters (repositories, gateways, queues). Concrete implementations live
// in internal/adapters/**.
package ports

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/vanlink-ltda/paymentshub/internal/domain/beneficiary"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

// PaymentRepository persists payments and their audit events.
type PaymentRepository interface {
	Insert(ctx context.Context, p *payment.Payment) error
	Get(ctx context.Context, id uuid.UUID) (*payment.Payment, error)
	GetByIdempotencyKey(ctx context.Context, key string) (*payment.Payment, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, to payment.Status, bankRef, rejectReason string) error
	ListByStatus(ctx context.Context, status payment.Status, limit, offset int) ([]*payment.Payment, error)
}

// PaymentEventRepository records the audit trail for every state transition.
type PaymentEventRepository interface {
	Insert(ctx context.Context, evt PaymentEvent) error
	ListForPayment(ctx context.Context, paymentID uuid.UUID) ([]PaymentEvent, error)
}

// PaymentEvent is a DTO used across the repository boundary. It mirrors the
// payment_events table 1:1.
type PaymentEvent struct {
	ID            uuid.UUID
	PaymentID     uuid.UUID
	FromStatus    string
	ToStatus      string
	Actor         string
	Reason        string
	Payload       map[string]any
	CorrelationID string
	At            time.Time
}

// IdempotencyRepository caches HTTP request/response pairs to support
// Idempotency-Key on POST /v1/payments*.
type IdempotencyRepository interface {
	Insert(ctx context.Context, rec IdempotencyRecord) error
	Get(ctx context.Context, key string) (*IdempotencyRecord, error)
	DeleteExpired(ctx context.Context) error
}

type IdempotencyRecord struct {
	Key              string
	Scope            string
	RequestHash      string
	ResponseSnapshot map[string]any
	StatusCode       int
	CreatedAt        time.Time
	ExpiresAt        time.Time
}

// APIKeyRepository is the auth storage.
type APIKeyRepository interface {
	Insert(ctx context.Context, rec APIKey) error
	GetByHash(ctx context.Context, hash string) (*APIKey, error)
	Revoke(ctx context.Context, id uuid.UUID) error
	Touch(ctx context.Context, id uuid.UUID) error
}

type APIKey struct {
	ID         uuid.UUID
	ClientID   *uuid.UUID
	Label      string
	KeyHash    string
	Scopes     []string
	Active     bool
	LastUsedAt *time.Time
	CreatedAt  time.Time
	ExpiresAt  *time.Time
}

// BeneficiaryRepository is the read/write access to beneficiaries plus nested
// pix keys and bank accounts.
type BeneficiaryRepository interface {
	Insert(ctx context.Context, b *beneficiary.Beneficiary) error
	Get(ctx context.Context, id uuid.UUID) (*beneficiary.Beneficiary, error)
	GetByDocument(ctx context.Context, doc string) (*beneficiary.Beneficiary, error)
	List(ctx context.Context, limit, offset int) ([]*beneficiary.Beneficiary, error)
	InsertPixKey(ctx context.Context, k *beneficiary.PixKey) error
	ListPixKeys(ctx context.Context, beneficiaryID uuid.UUID) ([]*beneficiary.PixKey, error)
	InsertBankAccount(ctx context.Context, a *beneficiary.BankAccount) error
	ListBankAccounts(ctx context.Context, beneficiaryID uuid.UUID) ([]*beneficiary.BankAccount, error)
}

// PayerAccountRepository — minimal for Phase 1 (Insert/Get/List).
type PayerAccountRepository interface {
	Insert(ctx context.Context, rec PayerAccount) error
	Get(ctx context.Context, id uuid.UUID) (*PayerAccount, error)
	GetByLabel(ctx context.Context, label string) (*PayerAccount, error)
	List(ctx context.Context) ([]*PayerAccount, error)
}

type PayerAccount struct {
	ID             uuid.UUID
	BankCode       string
	Agency         string
	AccountNumber  string
	AccountDigit   string
	CertificateID  *uuid.UUID
	OAuthClientID  string
	OAuthSecretRef string
	SFTPHost       string
	SFTPUser       string
	SFTPKeyRef     string
	SFTPRemessaDir string
	SFTPRetornoDir string
	Label          string
	Active         bool
}
