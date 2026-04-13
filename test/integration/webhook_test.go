//go:build integration

package integration_test

import (
	"context"
	"encoding/json"
	nethttp "net/http"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
	"github.com/vanlink-ltda/paymentshub/internal/testsupport"
)

func TestIntegration_Webhook_Itau_SettlesPayment(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	ctx := context.Background()
	payerID := seedPayerAcct(t, api)

	// Create a payment directly in SENT state (simulates PIX already submitted)
	pid := uuid.New()
	require.NoError(t, api.Payments.Insert(ctx, &payment.Payment{
		ID:                  pid,
		Type:                payment.TypePIX,
		Status:              payment.StatusSent,
		Amount:              10000,
		Currency:            "BRL",
		PayerAccountID:      payerID,
		BeneficiarySnapshot: map[string]any{},
		PayeeMethod:         payment.PayeeMethodPIXKey,
		Payee:               map[string]any{"key_type": "EVP", "key_value": "abc"},
		IdempotencyKey:      "webhook-test-1",
	}))
	// bank_reference is not part of INSERT — set it via update
	require.NoError(t, api.Payments.UpdateStatus(ctx, pid, payment.StatusSent, "cod-abc-123", ""))

	// Send webhook notification — no auth required on webhook endpoint
	resp := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/webhooks/itau", map[string]any{
		"event_id":           "evt-001",
		"codigoSolicitacao":  "cod-abc-123",
		"status":             "FINALIZADO",
		"endToEndId":         "E99999999evt001",
	}, "")
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusOK, resp.StatusCode)

	// Payment should now be SETTLED
	loaded, err := api.Payments.Get(ctx, pid)
	require.NoError(t, err)
	require.Equal(t, payment.StatusSettled, loaded.Status)

	// Audit event should be recorded
	events, err := api.Events.ListForPayment(ctx, pid)
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(events), 1)
	last := events[len(events)-1]
	require.Equal(t, "SETTLED", last.ToStatus)
	require.Equal(t, "BANK", last.Actor)
}

func TestIntegration_Webhook_Itau_Idempotent(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	ctx := context.Background()
	payerID := seedPayerAcct(t, api)

	pid := uuid.New()
	require.NoError(t, api.Payments.Insert(ctx, &payment.Payment{
		ID:                  pid,
		Type:                payment.TypePIX,
		Status:              payment.StatusSent,
		Amount:              5000,
		Currency:            "BRL",
		PayerAccountID:      payerID,
		BeneficiarySnapshot: map[string]any{},
		PayeeMethod:         payment.PayeeMethodPIXKey,
		Payee:               map[string]any{"key_type": "CPF", "key_value": "123"},
		IdempotencyKey:      "webhook-test-2",
	}))
	require.NoError(t, api.Payments.UpdateStatus(ctx, pid, payment.StatusSent, "cod-xyz-456", ""))

	payload := map[string]any{
		"event_id":          "evt-002",
		"codigoSolicitacao": "cod-xyz-456",
		"status":            "LIQUIDADO",
	}

	// First call settles
	r1 := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/webhooks/itau", payload, "")
	r1.Body.Close()
	require.Equal(t, nethttp.StatusOK, r1.StatusCode)

	// Second call is a no-op (already SETTLED)
	r2 := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/webhooks/itau", payload, "")
	r2.Body.Close()
	require.Equal(t, nethttp.StatusOK, r2.StatusCode)

	events, _ := api.Events.ListForPayment(ctx, pid)
	settledCount := 0
	for _, e := range events {
		if e.ToStatus == "SETTLED" {
			settledCount++
		}
	}
	require.Equal(t, 1, settledCount, "should only settle once")
}

func TestIntegration_Webhook_Itau_UnknownBankRef_200(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)

	resp := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/webhooks/itau", map[string]any{
		"event_id":          "evt-999",
		"codigoSolicitacao": "not-in-our-system",
		"status":            "FINALIZADO",
	}, "")
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusOK, resp.StatusCode)
}

// Suppress unused import for json
var _ = json.Marshal
