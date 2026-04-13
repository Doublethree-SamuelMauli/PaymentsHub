// Package client models a SaaS tenant — the company that uses PaymentsHub.
package client

import (
	"time"

	"github.com/google/uuid"
)

type Client struct {
	ID             uuid.UUID
	Name           string
	DocumentType   string // CPF|CNPJ
	DocumentNumber string
	Active         bool
	WebhookURL     string
	WebhookSecret  string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
