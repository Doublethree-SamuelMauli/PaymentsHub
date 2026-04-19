// Package btg integrates with BTG Pactual's corporate banking APIs.
//
// Docs: https://developers.btgpactual.com
// Auth: OAuth2 client_credentials + mTLS.
// PIX endpoint: /api-corp/pix-payments/v1/payments
package btg

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/bankcore"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

const BankCode = "208"

type Config struct {
	BaseURL      string // https://api.btgpactual.com
	TokenURL     string
	ClientID     string
	ClientSecret string
	Scope        string
	TLS          *tls.Config
	HTTPTimeout  time.Duration
}

type Client struct {
	core *bankcore.Client
}

func NewClient(cfg Config) *Client {
	timeout := cfg.HTTPTimeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}
	tokenHTTP := &http.Client{Timeout: timeout, Transport: &http.Transport{TLSClientConfig: cfg.TLS}}
	tokenSrc := bankcore.NewTokenSource(tokenHTTP, bankcore.TokenConfig{
		TokenURL:     cfg.TokenURL,
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		Scope:        cfg.Scope,
		AuthStyle:    bankcore.AuthBodyParams,
	})
	core := bankcore.NewClient(bankcore.ClientConfig{
		BaseURL:     cfg.BaseURL,
		TLSConfig:   cfg.TLS,
		HTTPTimeout: timeout,
		BreakerName: "btg-rest",
		Token:       tokenSrc,
	})
	return &Client{core: core}
}

var _ ports.PaymentGateway = (*Client)(nil)

func (c *Client) SendPix(ctx context.Context, req ports.SendPixRequest) (*ports.SendPixResult, error) {
	body := map[string]any{
		"amount":      formatValor(req.Amount.Int64()),
		"description": req.Description,
		"pixKey":      req.PayeeKeyValue,
		"keyType":     req.PayeeKeyType,
	}
	raw, _, err := c.core.Do(ctx, "POST", "/api-corp/pix-payments/v1/payments", body, map[string]string{
		"X-Idempotency-Key": req.IdempotencyKey,
	})
	if err != nil {
		return nil, err
	}
	var parsed struct {
		ID         string `json:"paymentId"`
		EndToEndID string `json:"endToEndId"`
		Status     string `json:"status"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)
	st := payment.StatusSent
	if parsed.Status == "SETTLED" || parsed.Status == "COMPLETED" {
		st = payment.StatusSettled
	}
	return &ports.SendPixResult{
		BankReference: parsed.ID,
		EndToEndID:    parsed.EndToEndID,
		Status:        st,
		SubmittedAt:   time.Now(),
		RawResp:       rawMap,
	}, nil
}

func (c *Client) GetPixStatus(ctx context.Context, bankRef string) (*ports.PixStatusResult, error) {
	raw, _, err := c.core.Do(ctx, "GET", "/api-corp/pix-payments/v1/payments/"+bankRef, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		ID         string `json:"paymentId"`
		EndToEndID string `json:"endToEndId"`
		Status     string `json:"status"`
		SettledAt  string `json:"settledAt"`
		Reason     string `json:"statusReason"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)
	st := payment.StatusSent
	var settled *time.Time
	switch parsed.Status {
	case "SETTLED", "COMPLETED":
		st = payment.StatusSettled
		if t, err := time.Parse(time.RFC3339, parsed.SettledAt); err == nil {
			settled = &t
		}
	case "REJECTED", "FAILED":
		st = payment.StatusFailed
	}
	return &ports.PixStatusResult{
		BankReference: parsed.ID,
		EndToEndID:    parsed.EndToEndID,
		Status:        st,
		SettledAt:     settled,
		Reason:        parsed.Reason,
		RawResp:       rawMap,
	}, nil
}

func (c *Client) PrevalidatePix(ctx context.Context, req ports.PrevalidatePixRequest) (*ports.PrevalidatePixResult, error) {
	raw, _, err := c.core.Do(ctx, "GET", "/api-corp/pix-dict/v1/keys/"+req.KeyValue, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		Name     string `json:"holderName"`
		Document string `json:"holderDocument"`
		Status   string `json:"status"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)
	verdict := "OK"
	if parsed.Status != "" && parsed.Status != "ACTIVE" {
		verdict = "REJECT"
	}
	return &ports.PrevalidatePixResult{
		Verdict:   verdict,
		OwnerName: parsed.Name,
		OwnerDoc:  parsed.Document,
		RawResp:   rawMap,
	}, nil
}

func formatValor(cents int64) string {
	reais := cents / 100
	cs := cents % 100
	return strconv.FormatInt(reais, 10) + "." + fmt.Sprintf("%02d", cs)
}
