//go:build integration

package integration_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	nethttp "net/http"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/http/dto"
	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/testsupport"
)

const writeToken = "test-write-token-123456"

func seedWriteAPIKey(t *testing.T, api *testsupport.API) {
	t.Helper()
	require.NoError(t, api.APIKeys.Insert(context.Background(), ports.APIKey{
		ID:      uuid.New(),
		Label:   "writer",
		KeyHash: mw.HashToken(writeToken),
		Scopes:  []string{"payments:write"},
		Active:  true,
	}))
}

func seedPayerAcct(t *testing.T, api *testsupport.API) uuid.UUID {
	t.Helper()
	id := uuid.New()
	require.NoError(t, api.PayerAccounts.Insert(context.Background(), ports.PayerAccount{
		ID:             id,
		BankCode:       "341",
		Agency:         "1234",
		AccountNumber:  "56789",
		AccountDigit:   "0",
		OAuthClientID:  "x",
		OAuthSecretRef: "x",
		Label:          "itau-main-" + id.String()[:8],
		Active:         true,
	}))
	return id
}

func postPayment(t *testing.T, api *testsupport.API, body []byte, headers map[string]string) *nethttp.Response {
	t.Helper()
	req, err := nethttp.NewRequestWithContext(context.Background(), nethttp.MethodPost, api.BaseURL+"/v1/payments", bytes.NewReader(body))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	client := &nethttp.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	require.NoError(t, err)
	return resp
}

func TestIntegration_Ingress_Create_HappyPath(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedWriteAPIKey(t, api)
	payerID := seedPayerAcct(t, api)

	body, _ := json.Marshal(map[string]any{
		"external_id":      "NF-001",
		"type":             "PIX",
		"amount_cents":     15000,
		"payer_account_id": payerID.String(),
		"payee_method":     "PIX_KEY",
		"payee":            map[string]string{"key_type": "CNPJ", "key_value": "12345678000190"},
		"description":      "pagamento NF 001",
	})

	resp := postPayment(t, api, body, map[string]string{
		"Authorization":   "Bearer " + writeToken,
		"Idempotency-Key": "idem-happy-1",
	})
	defer resp.Body.Close()

	require.Equal(t, nethttp.StatusCreated, resp.StatusCode)
	raw, _ := io.ReadAll(resp.Body)
	var pr dto.PaymentResponse
	require.NoError(t, json.Unmarshal(raw, &pr))
	require.Equal(t, "PIX", pr.Type)
	require.Equal(t, "RECEIVED", pr.Status)
	require.Equal(t, int64(15000), pr.AmountCents)
	require.Equal(t, "idem-happy-1", pr.IdempotencyKey)

	// Fetch the payment back (authenticated)
	getReq, _ := nethttp.NewRequestWithContext(context.Background(), nethttp.MethodGet, api.BaseURL+"/v1/payments/"+pr.ID, nil)
	getReq.Header.Set("Authorization", "Bearer "+writeToken)
	client := &nethttp.Client{Timeout: 5 * time.Second}
	getResp, err := client.Do(getReq)
	require.NoError(t, err)
	defer getResp.Body.Close()
	require.Equal(t, nethttp.StatusOK, getResp.StatusCode)

	var detail dto.PaymentDetailResponse
	require.NoError(t, json.NewDecoder(getResp.Body).Decode(&detail))
	require.Equal(t, pr.ID, detail.Payment.ID)
	require.Len(t, detail.Timeline, 1)
	require.Equal(t, "RECEIVED", detail.Timeline[0].ToStatus)
	require.Equal(t, "apikey:writer", detail.Timeline[0].Actor)
}

func TestIntegration_Ingress_IdempotentReplay_SameBody(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedWriteAPIKey(t, api)
	payerID := seedPayerAcct(t, api)

	body, _ := json.Marshal(map[string]any{
		"type":             "PIX",
		"amount_cents":     10000,
		"payer_account_id": payerID.String(),
		"payee_method":     "PIX_KEY",
		"payee":            map[string]string{"key_type": "EVP", "key_value": "abc-123"},
	})

	first := postPayment(t, api, body, map[string]string{
		"Authorization":   "Bearer " + writeToken,
		"Idempotency-Key": "idem-replay-1",
	})
	defer first.Body.Close()
	require.Equal(t, nethttp.StatusCreated, first.StatusCode)
	var firstResp dto.PaymentResponse
	require.NoError(t, json.NewDecoder(first.Body).Decode(&firstResp))

	second := postPayment(t, api, body, map[string]string{
		"Authorization":   "Bearer " + writeToken,
		"Idempotency-Key": "idem-replay-1",
	})
	defer second.Body.Close()
	require.Equal(t, nethttp.StatusOK, second.StatusCode)
	var secondResp dto.PaymentResponse
	require.NoError(t, json.NewDecoder(second.Body).Decode(&secondResp))

	require.Equal(t, firstResp.ID, secondResp.ID, "replay should return same payment id")
}

func TestIntegration_Ingress_IdempotentReplay_DifferentBody_409(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedWriteAPIKey(t, api)
	payerID := seedPayerAcct(t, api)

	body1, _ := json.Marshal(map[string]any{
		"type":             "PIX",
		"amount_cents":     10000,
		"payer_account_id": payerID.String(),
		"payee_method":     "PIX_KEY",
		"payee":            map[string]string{"key_type": "CPF", "key_value": "12345678901"},
	})
	body2, _ := json.Marshal(map[string]any{
		"type":             "PIX",
		"amount_cents":     50000,
		"payer_account_id": payerID.String(),
		"payee_method":     "PIX_KEY",
		"payee":            map[string]string{"key_type": "CPF", "key_value": "12345678901"},
	})

	r1 := postPayment(t, api, body1, map[string]string{
		"Authorization":   "Bearer " + writeToken,
		"Idempotency-Key": "idem-conflict",
	})
	r1.Body.Close()
	require.Equal(t, nethttp.StatusCreated, r1.StatusCode)

	r2 := postPayment(t, api, body2, map[string]string{
		"Authorization":   "Bearer " + writeToken,
		"Idempotency-Key": "idem-conflict",
	})
	defer r2.Body.Close()
	require.Equal(t, nethttp.StatusConflict, r2.StatusCode)
}

func TestIntegration_Ingress_InvalidAuth_401(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	payerID := seedPayerAcct(t, api)

	body, _ := json.Marshal(map[string]any{
		"type":             "PIX",
		"amount_cents":     1,
		"payer_account_id": payerID.String(),
		"payee_method":     "PIX_KEY",
		"payee":            map[string]string{"key_type": "EVP", "key_value": "x"},
	})

	resp := postPayment(t, api, body, map[string]string{
		"Authorization":   "Bearer wrong-token",
		"Idempotency-Key": "idem-401",
	})
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusUnauthorized, resp.StatusCode)
}

func TestIntegration_Ingress_MissingIdempotencyKey_400(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedWriteAPIKey(t, api)
	payerID := seedPayerAcct(t, api)

	body, _ := json.Marshal(map[string]any{
		"type":             "PIX",
		"amount_cents":     1,
		"payer_account_id": payerID.String(),
		"payee_method":     "PIX_KEY",
		"payee":            map[string]string{"key_type": "EVP", "key_value": "x"},
	})

	resp := postPayment(t, api, body, map[string]string{
		"Authorization": "Bearer " + writeToken,
	})
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusBadRequest, resp.StatusCode)
}

func TestIntegration_Ingress_ScopeEnforcement_403(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	payerID := seedPayerAcct(t, api)

	// Seed a token with no write scope.
	readerToken := "reader-token-xyz"
	require.NoError(t, api.APIKeys.Insert(context.Background(), ports.APIKey{
		ID:      uuid.New(),
		Label:   "reader",
		KeyHash: mw.HashToken(readerToken),
		Scopes:  []string{"payments:read"},
		Active:  true,
	}))

	body, _ := json.Marshal(map[string]any{
		"type":             "PIX",
		"amount_cents":     1,
		"payer_account_id": payerID.String(),
		"payee_method":     "PIX_KEY",
		"payee":            map[string]string{"key_type": "EVP", "key_value": "x"},
	})

	resp := postPayment(t, api, body, map[string]string{
		"Authorization":   "Bearer " + readerToken,
		"Idempotency-Key": "idem-403",
	})
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusForbidden, resp.StatusCode)
}
