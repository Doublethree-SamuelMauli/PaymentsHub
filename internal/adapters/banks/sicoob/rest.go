// Package sicoob integrates with Sicoob's Cooperative Banking APIs.
//
// Docs: https://developers.sicoob.com.br
// Auth: OAuth2 client_credentials + mTLS certificate.
// Token URL (sandbox): https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token
// PIX endpoints: /pix-pagamentos/v2/
package sicoob

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

const BankCode = "756"

type Config struct {
	BaseURL      string // https://api.sicoob.com.br
	TokenURL     string
	ClientID     string
	ClientSecret string
	Scope        string // "pix_pagamentos_write pix_pagamentos_read"
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
	if cfg.Scope == "" {
		cfg.Scope = "pix_pagamentos_write pix_pagamentos_read"
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
		BreakerName: "sicoob-rest",
		Token:       tokenSrc,
		Decorator: func(req *http.Request) {
			req.Header.Set("client_id", cfg.ClientID)
		},
	})
	return &Client{core: core}
}

var _ ports.PaymentGateway = (*Client)(nil)

func (c *Client) SendPix(ctx context.Context, req ports.SendPixRequest) (*ports.SendPixResult, error) {
	body := map[string]any{
		"valor":     formatValor(req.Amount.Int64()),
		"descricao": req.Description,
		"chave":     req.PayeeKeyValue,
	}
	raw, _, err := c.core.Do(ctx, "POST", "/pix-pagamentos/v2/envios", body, map[string]string{
		"X-Idempotency-Key": req.IdempotencyKey,
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
	raw, _, err := c.core.Do(ctx, "GET", "/pix-pagamentos/v2/envios/"+bankRef, nil, nil)
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
	raw, _, err := c.core.Do(ctx, "GET", "/pix-dict/v2/chaves/"+req.KeyValue, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		Titular   string `json:"nomeTitular"`
		Documento string `json:"cpfCnpj"`
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
