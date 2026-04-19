// Package bradesco integrates with the Bradesco PIX and Pagamento APIs.
//
// Auth: OAuth2 (client_credentials) with HTTP Basic for the client pair,
// plus mTLS certificate exchange.
// Endpoints follow the public "Bradesco Open Banking"/Open Finance pattern
// documented at https://developers.bradesco.com.br (token at /auth/server/v1.1
// and PIX envelope at /v1/pix/envio). Field shapes here are adapters — they
// serialize whatever Bradesco's sandbox returns into our domain types.
package bradesco

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

const BankCode = "237"

// Config carries everything a Bradesco PIX caller needs.
type Config struct {
	BaseURL      string // e.g. https://proxy.api.prebanco.com.br
	TokenURL     string // e.g. https://proxy.api.prebanco.com.br/auth/server/v1.1/token
	ClientID     string
	ClientSecret string
	TLS          *tls.Config
	HTTPTimeout  time.Duration
}

// Client is the Bradesco REST adapter.
type Client struct {
	core *bankcore.Client
}

// NewClient builds a configured client.
func NewClient(cfg Config) *Client {
	timeout := cfg.HTTPTimeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}
	tokenHTTP := &http.Client{
		Timeout:   timeout,
		Transport: &http.Transport{TLSClientConfig: cfg.TLS},
	}
	tokenSrc := bankcore.NewTokenSource(tokenHTTP, bankcore.TokenConfig{
		TokenURL:     cfg.TokenURL,
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		AuthStyle:    bankcore.AuthBasicHeader,
	})
	core := bankcore.NewClient(bankcore.ClientConfig{
		BaseURL:     cfg.BaseURL,
		TLSConfig:   cfg.TLS,
		HTTPTimeout: timeout,
		BreakerName: "bradesco-rest",
		Token:       tokenSrc,
	})
	return &Client{core: core}
}

var _ ports.PaymentGateway = (*Client)(nil)

// SendPix submits an individual PIX transfer.
// Bradesco uses POST /v1/pix/envio (envio = send). Idempotency is tracked by
// the caller's endToEndId which we derive from the gateway key.
func (c *Client) SendPix(ctx context.Context, req ports.SendPixRequest) (*ports.SendPixResult, error) {
	body := map[string]any{
		"valor":       formatValor(req.Amount.Int64()),
		"descricao":   req.Description,
		"dataEnvio":   time.Now().Format(time.RFC3339),
		"endToEndId":  req.IdempotencyKey,
		"chave": map[string]any{
			"tipo":  req.PayeeKeyType,
			"valor": req.PayeeKeyValue,
		},
	}
	raw, _, err := c.core.Do(ctx, "POST", "/v1/pix/envio", body, map[string]string{
		"x-correlation-id": req.IdempotencyKey,
	})
	if err != nil {
		return nil, err
	}
	var parsed struct {
		IDTransacao string `json:"idTransacao"`
		EndToEndID  string `json:"endToEndId"`
		Status      string `json:"status"`
		Mensagem    string `json:"mensagem"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)
	st := payment.StatusSent
	if parsed.Status == "CONCLUIDO" || parsed.Status == "LIQUIDADO" {
		st = payment.StatusSettled
	}
	return &ports.SendPixResult{
		BankReference: parsed.IDTransacao,
		EndToEndID:    parsed.EndToEndID,
		Status:        st,
		SubmittedAt:   time.Now(),
		RawResp:       rawMap,
	}, nil
}

// GetPixStatus queries the transaction status by Bradesco's idTransacao.
func (c *Client) GetPixStatus(ctx context.Context, bankRef string) (*ports.PixStatusResult, error) {
	raw, _, err := c.core.Do(ctx, "GET", "/v1/pix/envio/"+bankRef, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		IDTransacao    string `json:"idTransacao"`
		Status         string `json:"status"`
		EndToEndID     string `json:"endToEndId"`
		DataLiquidacao string `json:"dataLiquidacao"`
		Motivo         string `json:"motivo"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)

	st := payment.StatusSent
	var settledAt *time.Time
	switch parsed.Status {
	case "CONCLUIDO", "LIQUIDADO", "SETTLED":
		st = payment.StatusSettled
		if t, err := time.Parse(time.RFC3339, parsed.DataLiquidacao); err == nil {
			settledAt = &t
		}
	case "REJEITADO", "FAILED":
		st = payment.StatusFailed
	}
	return &ports.PixStatusResult{
		BankReference: parsed.IDTransacao,
		EndToEndID:    parsed.EndToEndID,
		Status:        st,
		SettledAt:     settledAt,
		Reason:        parsed.Motivo,
		RawResp:       rawMap,
	}, nil
}

// PrevalidatePix looks up a DICT key at /v1/pix/dict/chaves/{key}.
func (c *Client) PrevalidatePix(ctx context.Context, req ports.PrevalidatePixRequest) (*ports.PrevalidatePixResult, error) {
	raw, _, err := c.core.Do(ctx, "GET", "/v1/pix/dict/chaves/"+req.KeyValue, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		Chave     string `json:"chave"`
		TipoChave string `json:"tipoChave"`
		Titular   string `json:"titular"`
		Documento string `json:"documento"`
		Status    string `json:"status"`
		Mensagem  string `json:"mensagem"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	verdict := "OK"
	if parsed.Status != "ATIVO" && parsed.Status != "" {
		verdict = "REJECT"
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)
	return &ports.PrevalidatePixResult{
		Verdict:   verdict,
		Reason:    parsed.Mensagem,
		OwnerName: parsed.Titular,
		OwnerDoc:  parsed.Documento,
		RawResp:   rawMap,
	}, nil
}

func formatValor(cents int64) string {
	reais := cents / 100
	cs := cents % 100
	return strconv.FormatInt(reais, 10) + "." + fmt.Sprintf("%02d", cs)
}
