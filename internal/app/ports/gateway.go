package ports

import (
	"context"
	"time"

	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

// PaymentGateway is the contract every bank adapter implements.
// Plan 05 ships the Itaú REST implementation; Plans 05/07 add the CNAB+SFTP half.
type PaymentGateway interface {
	// PrevalidatePix checks that a PIX key exists in DICT and returns the owner info.
	PrevalidatePix(ctx context.Context, req PrevalidatePixRequest) (*PrevalidatePixResult, error)

	// SendPix executes an individual PIX transfer.
	SendPix(ctx context.Context, req SendPixRequest) (*SendPixResult, error)

	// GetPixStatus queries an already-submitted PIX by bank reference.
	GetPixStatus(ctx context.Context, bankRef string) (*PixStatusResult, error)
}

// PrevalidatePixRequest describes an out-of-band DICT lookup.
type PrevalidatePixRequest struct {
	KeyType  string
	KeyValue string
}

// PrevalidatePixResult is what the DICT lookup returned.
type PrevalidatePixResult struct {
	Verdict   string // OK|REJECT|WARN
	Reason    string
	OwnerName string
	OwnerDoc  string
	RawResp   map[string]any
}

// SendPixRequest describes an individual PIX execution.
type SendPixRequest struct {
	IdempotencyKey string
	Amount         money.Cents
	PayerAccount   PayerAccount
	Description    string
	PayeeKeyType   string
	PayeeKeyValue  string
}

// SendPixResult mirrors the Itaú response shape.
type SendPixResult struct {
	BankReference string
	EndToEndID    string
	Status        payment.Status
	SubmittedAt   time.Time
	RawResp       map[string]any
}

// PixStatusResult is what /pix/{id} returns.
type PixStatusResult struct {
	BankReference string
	Status        payment.Status
	EndToEndID    string
	SettledAt     *time.Time
	Reason        string
	RawResp       map[string]any
}
