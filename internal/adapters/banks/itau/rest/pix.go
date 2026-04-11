package rest

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

// SendPix submits an individual PIX transfer via POST {base}/cash-management/v2/pix.
func (c *Client) SendPix(ctx context.Context, req ports.SendPixRequest) (*ports.SendPixResult, error) {
	if req.IdempotencyKey == "" {
		return nil, fmt.Errorf("%w: idempotency_key required", ErrBadResponse)
	}

	body := map[string]any{
		"valor":         formatCents(req.Amount.Int64()),
		"dataPagamento": time.Now().Format("2006-01-02"),
		"descricao":     req.Description,
		"destinatario": map[string]any{
			"tipo":  "CHAVE",
			"chave": req.PayeeKeyValue,
		},
	}

	raw, status, err := c.doRequest(ctx, "POST", "/cash-management/v2/pix", body, map[string]string{
		"x-id-idempotente": req.IdempotencyKey,
	})
	if err != nil {
		return nil, err
	}
	_ = status // retry layer already validated

	var parsed struct {
		CodigoSolicitacao string `json:"codigoSolicitacao"`
		Status            string `json:"status"`
		EndToEndID        string `json:"endToEndId"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrBadResponse, err)
	}
	if parsed.CodigoSolicitacao == "" {
		return nil, fmt.Errorf("%w: missing codigoSolicitacao", ErrBadResponse)
	}

	resultStatus := payment.StatusSent
	if parsed.Status == "APROVADO" || parsed.Status == "FINALIZADO" {
		resultStatus = payment.StatusSettled
	}

	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)

	return &ports.SendPixResult{
		BankReference: parsed.CodigoSolicitacao,
		EndToEndID:    parsed.EndToEndID,
		Status:        resultStatus,
		SubmittedAt:   time.Now(),
		RawResp:       rawMap,
	}, nil
}

// GetPixStatus queries the current status of a previously-submitted PIX.
func (c *Client) GetPixStatus(ctx context.Context, bankRef string) (*ports.PixStatusResult, error) {
	raw, _, err := c.doRequest(ctx, "GET", "/cash-management/v2/pix/"+bankRef, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		CodigoSolicitacao string `json:"codigoSolicitacao"`
		Status            string `json:"status"`
		EndToEndID        string `json:"endToEndId"`
		DataLiquidacao    string `json:"dataLiquidacao"`
		Motivo            string `json:"motivo"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrBadResponse, err)
	}

	st := payment.StatusSent
	var settledAt *time.Time
	switch parsed.Status {
	case "APROVADO", "FINALIZADO", "SETTLED":
		st = payment.StatusSettled
		if parsed.DataLiquidacao != "" {
			if t, err := time.Parse(time.RFC3339, parsed.DataLiquidacao); err == nil {
				settledAt = &t
			}
		}
	case "REJEITADO", "FALHOU", "FAILED":
		st = payment.StatusFailed
	}

	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)

	return &ports.PixStatusResult{
		BankReference: parsed.CodigoSolicitacao,
		EndToEndID:    parsed.EndToEndID,
		Status:        st,
		SettledAt:     settledAt,
		Reason:        parsed.Motivo,
		RawResp:       rawMap,
	}, nil
}

// PrevalidatePix queries DICT to verify a key's existence and owner.
func (c *Client) PrevalidatePix(ctx context.Context, req ports.PrevalidatePixRequest) (*ports.PrevalidatePixResult, error) {
	raw, _, err := c.doRequest(ctx, "GET", "/cash-management/v2/dict/keys/"+req.KeyValue, nil, nil)
	if err != nil {
		return nil, err
	}
	var parsed struct {
		Chave       string `json:"chave"`
		Tipo        string `json:"tipoChave"`
		Titular     string `json:"titular"`
		Documento   string `json:"documento"`
		Status      string `json:"status"`
		Description string `json:"descricao"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrBadResponse, err)
	}
	verdict := "OK"
	if parsed.Status == "INEXISTENTE" || parsed.Status == "INVALIDO" {
		verdict = "REJECT"
	}
	rawMap := map[string]any{}
	_ = json.Unmarshal(raw, &rawMap)
	return &ports.PrevalidatePixResult{
		Verdict:   verdict,
		Reason:    parsed.Description,
		OwnerName: parsed.Titular,
		OwnerDoc:  parsed.Documento,
		RawResp:   rawMap,
	}, nil
}

func formatCents(cents int64) string {
	// Itaú expects "12345.67"
	neg := cents < 0
	if neg {
		cents = -cents
	}
	reais := cents / 100
	cs := cents % 100
	s := strconv.FormatInt(reais, 10) + "." + fmt.Sprintf("%02d", cs)
	if neg {
		s = "-" + s
	}
	return s
}
