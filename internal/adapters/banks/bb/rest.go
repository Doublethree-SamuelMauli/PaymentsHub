// Package bb integrates with Banco do Brasil's payments API.
//
// Docs: https://developers.bb.com.br
// Auth: OAuth2 client_credentials + mTLS. Sandbox/prod hosts:
// sandbox     -> https://oauth.sandbox.bb.com.br/oauth/token
// production  -> https://oauth.bb.com.br/oauth/token
// PIX endpoint: /pix-pagamentos/v2
package bb

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

const BankCode = "001"

type Config struct {
	BaseURL      string // https://api.bb.com.br
	TokenURL     string // https://oauth.bb.com.br/oauth/token
	ClientID     string
	ClientSecret string
	GWAppKey     string // gw-app-key header, required for BB APIs
	TLS          *tls.Config
	Scope        string
	HTTPTimeout  time.Duration
}

type Client struct {
	cfg  Config
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
		AuthStyle:    bankcore.AuthBasicHeader,
	})
	core := bankcore.NewClient(bankcore.ClientConfig{
		BaseURL:     cfg.BaseURL,
		TLSConfig:   cfg.TLS,
		HTTPTimeout: timeout,
		BreakerName: "bb-rest",
		Token:       tokenSrc,
		Decorator: func(req *http.Request) {
			if cfg.GWAppKey != "" {
				q := req.URL.Query()
				q.Set("gw-app-key", cfg.GWAppKey)
				req.URL.RawQuery = q.Encode()
			}
		},
	})
	return &Client{cfg: cfg, core: core}
}

var _ ports.PaymentGateway = (*Client)(nil)

func (c *Client) SendPix(ctx context.Context, req ports.SendPixRequest) (*ports.SendPixResult, error) {
	body := map[string]any{
		"valor":     formatValor(req.Amount.Int64()),
		"descricao": req.Description,
		"chave":     req.PayeeKeyValue,
	}
	raw, _, err := c.core.Do(ctx, "POST", "/pix-pagamentos/v2", body, map[string]string{
		"x-requisicao-id": req.IdempotencyKey,
	})
	if err != nil {
		return nil, err
	}
	var parsed struct {
		ID         string `json:"idTransacao"`
		EndToEndID string `json:"endToEndId"`
		Status     string `json:"status"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)
	st := payment.StatusSent
	if parsed.Status == "LIQUIDADO" || parsed.Status == "CONFIRMADO" {
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
	raw, _, err := c.core.Do(ctx, "GET", "/pix-pagamentos/v2/"+bankRef, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		ID             string `json:"idTransacao"`
		EndToEndID     string `json:"endToEndId"`
		Status         string `json:"status"`
		DataLiquidacao string `json:"dataLiquidacao"`
		Motivo         string `json:"motivo"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)

	st := payment.StatusSent
	var settled *time.Time
	switch parsed.Status {
	case "LIQUIDADO", "CONFIRMADO":
		st = payment.StatusSettled
		if t, err := time.Parse(time.RFC3339, parsed.DataLiquidacao); err == nil {
			settled = &t
		}
	case "REJEITADO", "FALHOU":
		st = payment.StatusFailed
	}
	return &ports.PixStatusResult{
		BankReference: parsed.ID,
		EndToEndID:    parsed.EndToEndID,
		Status:        st,
		SettledAt:     settled,
		Reason:        parsed.Motivo,
		RawResp:       rawMap,
	}, nil
}

func (c *Client) PrevalidatePix(ctx context.Context, req ports.PrevalidatePixRequest) (*ports.PrevalidatePixResult, error) {
	raw, _, err := c.core.Do(ctx, "GET", "/pix-dict/v1/chaves/"+req.KeyValue, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		Titular   string `json:"nomeCorrentista"`
		Documento string `json:"cpfCnpjCorrentista"`
		Status    string `json:"status"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)
	verdict := "OK"
	if parsed.Status != "" && parsed.Status != "ATIVA" {
		verdict = "REJECT"
	}
	return &ports.PrevalidatePixResult{
		Verdict:   verdict,
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
