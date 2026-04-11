// Package beneficiary models companies/people a client pays (suppliers,
// employees, government, other clients). No state machine — beneficiaries
// are edited directly via CRUD.
package beneficiary

import (
	"time"

	"github.com/google/uuid"
)

type Kind string

const (
	KindSupplier   Kind = "SUPPLIER"
	KindClient     Kind = "CLIENT"
	KindEmployee   Kind = "EMPLOYEE"
	KindGovernment Kind = "GOVERNMENT"
	KindOther      Kind = "OTHER"
)

type DocumentType string

const (
	DocumentCPF  DocumentType = "CPF"
	DocumentCNPJ DocumentType = "CNPJ"
)

type Beneficiary struct {
	ID                   uuid.UUID
	Kind                 Kind
	LegalName            string
	TradeName            string
	DocumentType         DocumentType
	DocumentNumber       string
	Email                string
	Phone                string
	Tags                 []string
	DefaultPaymentMethod string
	Notes                string
	Active               bool
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

type PixKeyType string

const (
	PixKeyCPF   PixKeyType = "CPF"
	PixKeyCNPJ  PixKeyType = "CNPJ"
	PixKeyEmail PixKeyType = "EMAIL"
	PixKeyPhone PixKeyType = "PHONE"
	PixKeyEVP   PixKeyType = "EVP"
)

type PixKey struct {
	ID            uuid.UUID
	BeneficiaryID uuid.UUID
	KeyType       PixKeyType
	KeyValue      string
	Label         string
	Active        bool
	VerifiedAt    *time.Time
	CreatedAt     time.Time
}

type AccountType string

const (
	AccountTypeCC AccountType = "CC"
	AccountTypeCP AccountType = "CP"
	AccountTypePG AccountType = "PG"
)

type BankAccount struct {
	ID            uuid.UUID
	BeneficiaryID uuid.UUID
	BankCode      string
	Agency        string
	AccountNumber string
	AccountDigit  string
	AccountType   AccountType
	Label         string
	Active        bool
	VerifiedAt    *time.Time
	CreatedAt     time.Time
}
