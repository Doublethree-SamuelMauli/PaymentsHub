// Package caixa integrates with Caixa Econômica Federal's payment rails.
//
// Caixa's retail payments run primarily over SICN (Sistema Integrado de
// Comunicação com a Caixa) using CNAB 240 files over SFTP, not a synchronous
// REST PIX endpoint like Itaú. This adapter therefore:
//
//   - implements PaymentGateway by returning ports.ErrUnsupported on the PIX
//     methods, so callers know to route Caixa payments through the batch
//     (CNAB) path instead of trying the REST path first.
//   - can be extended to call Caixa's newer /pix/envio endpoint as it becomes
//     generally available. The Config wiring is already in place.
//
// The real production path for Caixa today is:
//
//	internal/adapters/banks/itau/cnab (generic CNAB 240 encoder)
//	  + internal/adapters/banks/itau/sftp.RemoteFileTransfer (SFTP transport)
//
// with Caixa-specific header fields (convenio, banco 104) supplied by the
// caller. We share the Itaú CNAB encoder because the FEBRABAN 240 layout is
// common across banks; the header record carries the bank code.
package caixa

import (
	"context"
	"crypto/tls"
	"errors"
	"time"

	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
)

const BankCode = "104"

// ErrUseBatch is returned when a caller asks for synchronous PIX on Caixa.
// Caixa payments must go through the CNAB batch path.
var ErrUseBatch = errors.New("caixa: synchronous PIX not available; use CNAB batch")

type Config struct {
	BaseURL     string
	ClientID    string
	APIKey      string
	TLS         *tls.Config
	HTTPTimeout time.Duration
}

// Client is the Caixa stub. All PaymentGateway methods report back to the
// caller so the orchestrator routes to CNAB instead of trying REST.
type Client struct {
	cfg Config
}

func NewClient(cfg Config) *Client { return &Client{cfg: cfg} }

var _ ports.PaymentGateway = (*Client)(nil)

func (c *Client) SendPix(ctx context.Context, req ports.SendPixRequest) (*ports.SendPixResult, error) {
	return nil, ErrUseBatch
}

func (c *Client) GetPixStatus(ctx context.Context, bankRef string) (*ports.PixStatusResult, error) {
	return nil, ErrUseBatch
}

func (c *Client) PrevalidatePix(ctx context.Context, req ports.PrevalidatePixRequest) (*ports.PrevalidatePixResult, error) {
	// Caixa has no DICT-equivalent exposed publicly; pre-validation for a
	// Caixa payer must fall back to the default "WARN" (unknown) verdict.
	return &ports.PrevalidatePixResult{
		Verdict: "WARN",
		Reason:  "Caixa does not expose DICT pre-validation; will be validated at CNAB submission",
	}, nil
}
