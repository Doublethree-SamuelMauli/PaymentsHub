// Package inter integrates with Banco Inter's Business Banking API.
//
// Docs: https://developers.bancointer.com.br/reference
// Auth: OAuth2 client_credentials + A1 certificate (mTLS) at
// https://cdpj.partners.bancointer.com.br/oauth/v2/token.
// PIX endpoints live under /banking/v2/pix. This adapter keeps field
// mapping light and defers to Inter's response envelope whenever possible.
package inter

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

const BankCode = "077"

type Config struct {
	BaseURL      string // https://cdpj.partners.bancointer.com.br
	TokenURL     string // https://cdpj.partners.bancointer.com.br/oauth/v2/token
	ClientID     string
	ClientSecret string
	AccountID    string // conta-corrente header: x-conta-corrente
	Scope        string // "pagamento-pix.write pagamento-pix.read"
	TLS          *tls.Config
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
	if cfg.Scope == "" {
		cfg.Scope = "pagamento-pix.write pagamento-pix.read"
	}
	tokenHTTP := &http.Client{
		Timeout:   timeout,
		Transport: &http.Transport{TLSClientConfig: cfg.TLS},
	}
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
		BreakerName: "inter-rest",
		Token:       tokenSrc,
		Decorator: func(req *http.Request) {
			if cfg.AccountID != "" {
				req.Header.Set("x-conta-corrente", cfg.AccountID)
			}
		},
	})
	return &Client{cfg: cfg, core: core}
}

var _ ports.PaymentGateway = (*Client)(nil)

func (c *Client) SendPix(ctx context.Context, req ports.SendPixRequest) (*ports.SendPixResult, error) {
	body := map[string]any{
		"valor":       formatValor(req.Amount.Int64()),
		"descricao":   req.Description,
		"destinatario": map[string]any{
			"tipo":  "CHAVE",
			"chave": req.PayeeKeyValue,
		},
	}
	raw, _, err := c.core.Do(ctx, "POST", "/banking/v2/pix", body, map[string]string{
		"x-id-idempotente": req.IdempotencyKey,
	})
	if err != nil {
		return nil, err
	}
	var parsed struct {
		CodigoSolicitacao string `json:"codigoSolicitacao"`
		EndToEndID        string `json:"endToEndId"`
		Status            string `json:"status"`
		DataPagamento     string `json:"dataPagamento"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)
	st := payment.StatusSent
	if parsed.Status == "APROVADO" || parsed.Status == "APROVADA" {
		st = payment.StatusSettled
	}
	return &ports.SendPixResult{
		BankReference: parsed.CodigoSolicitacao,
		EndToEndID:    parsed.EndToEndID,
		Status:        st,
		SubmittedAt:   time.Now(),
		RawResp:       rawMap,
	}, nil
}

func (c *Client) GetPixStatus(ctx context.Context, bankRef string) (*ports.PixStatusResult, error) {
	raw, _, err := c.core.Do(ctx, "GET", "/banking/v2/pix/"+bankRef, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		CodigoSolicitacao string `json:"codigoSolicitacao"`
		EndToEndID        string `json:"endToEndId"`
		Status            string `json:"status"`
		DataLiquidacao    string `json:"dataLiquidacao"`
		Motivo            string `json:"motivo"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)

	st := payment.StatusSent
	var settledAt *time.Time
	switch parsed.Status {
	case "APROVADO", "APROVADA", "LIQUIDADO":
		st = payment.StatusSettled
		if t, err := time.Parse(time.RFC3339, parsed.DataLiquidacao); err == nil {
			settledAt = &t
		}
	case "REJEITADO", "FALHOU":
		st = payment.StatusFailed
	}
	return &ports.PixStatusResult{
		BankReference: parsed.CodigoSolicitacao,
		EndToEndID:    parsed.EndToEndID,
		Status:        st,
		SettledAt:     settledAt,
		Reason:        parsed.Motivo,
		RawResp:       rawMap,
	}, nil
}

func (c *Client) PrevalidatePix(ctx context.Context, req ports.PrevalidatePixRequest) (*ports.PrevalidatePixResult, error) {
	raw, _, err := c.core.Do(ctx, "GET", "/banking/v2/pix/chaves/"+req.KeyValue, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		Chave     string `json:"chave"`
		TipoChave string `json:"tipoChave"`
		Titular   string `json:"nomeCompleto"`
		Documento string `json:"cpfCnpj"`
		Status    string `json:"status"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", bankcore.ErrBadResponse, err)
	}
	verdict := "OK"
	if parsed.Status != "ATIVA" && parsed.Status != "" {
		verdict = "REJECT"
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)
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
