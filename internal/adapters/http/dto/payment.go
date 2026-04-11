// Package dto holds HTTP request/response shapes for PaymentsHub handlers.
// DTOs live on the HTTP boundary only; they are never reused as domain types.
package dto

import (
	"encoding/json"
	"time"
)

// CreatePaymentRequest is the wire shape for POST /v1/payments.
type CreatePaymentRequest struct {
	ExternalID     string          `json:"external_id" validate:"max=128"`
	Type           string          `json:"type" validate:"required,oneof=PIX TED"`
	AmountCents    int64           `json:"amount_cents" validate:"required,gt=0"`
	PayerAccountID string          `json:"payer_account_id" validate:"required,uuid4"`
	BeneficiaryID  string          `json:"beneficiary_id" validate:"omitempty,uuid4"`
	PayeeMethod    string          `json:"payee_method" validate:"required,oneof=PIX_KEY BANK_ACCOUNT"`
	Payee          json.RawMessage `json:"payee" validate:"required"`
	Description    string          `json:"description" validate:"max=140"`
	ScheduledFor   string          `json:"scheduled_for" validate:"omitempty,datetime=2006-01-02"`
}

// PaymentResponse is the wire shape returned by POST and GET endpoints.
type PaymentResponse struct {
	ID             string         `json:"id"`
	ExternalID     string         `json:"external_id,omitempty"`
	Type           string         `json:"type"`
	Status         string         `json:"status"`
	AmountCents    int64          `json:"amount_cents"`
	Currency       string         `json:"currency"`
	PayerAccountID string         `json:"payer_account_id"`
	BeneficiaryID  string         `json:"beneficiary_id,omitempty"`
	PayeeMethod    string         `json:"payee_method"`
	Payee          map[string]any `json:"payee"`
	Description    string         `json:"description,omitempty"`
	ScheduledFor   string         `json:"scheduled_for,omitempty"`
	IdempotencyKey string         `json:"idempotency_key"`
	BankReference  string         `json:"bank_reference,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

// PaymentEventResponse is a timeline entry under GET /v1/payments/:id.
type PaymentEventResponse struct {
	At         time.Time      `json:"at"`
	FromStatus string         `json:"from_status,omitempty"`
	ToStatus   string         `json:"to_status"`
	Actor      string         `json:"actor"`
	Reason     string         `json:"reason,omitempty"`
	Payload    map[string]any `json:"payload,omitempty"`
}

// PaymentDetailResponse wraps payment + timeline for GET /v1/payments/:id.
type PaymentDetailResponse struct {
	Payment  PaymentResponse        `json:"payment"`
	Timeline []PaymentEventResponse `json:"timeline"`
}

// ErrorResponse is the uniform error envelope.
type ErrorResponse struct {
	Error   string         `json:"error"`
	Details map[string]any `json:"details,omitempty"`
}
