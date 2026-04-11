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

	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
	"github.com/vanlink-ltda/paymentshub/internal/testsupport"
)

const adminToken = "test-admin-token-xyzxyz"

func seedAdminKey(t *testing.T, api *testsupport.API) {
	t.Helper()
	require.NoError(t, api.APIKeys.Insert(context.Background(), ports.APIKey{
		ID:      uuid.New(),
		Label:   "admin",
		KeyHash: mw.HashToken(adminToken),
		Scopes:  []string{"admin"},
		Active:  true,
	}))
}

func doJSON(t *testing.T, method, url string, body any, token string) *nethttp.Response {
	t.Helper()
	var r io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		r = bytes.NewReader(b)
	}
	req, err := nethttp.NewRequestWithContext(context.Background(), method, url, r)
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	client := &nethttp.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	require.NoError(t, err)
	return resp
}

func TestIntegration_ApprovalFlow_PrevalidatedToApproved(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedAdminKey(t, api)
	payerID := seedPayerAcct(t, api)

	// Create one payment directly at status PREVALIDATED (simulates the later
	// Itaú REST oracle having approved it — real flow arrives in Plan 05).
	ctx := context.Background()
	p1ID := uuid.New()
	require.NoError(t, api.Payments.Insert(ctx, &payment.Payment{
		ID:                  p1ID,
		Type:                payment.TypePIX,
		Status:              payment.StatusPrevalidated,
		Amount:              15000,
		Currency:            "BRL",
		PayerAccountID:      payerID,
		BeneficiarySnapshot: map[string]any{},
		PayeeMethod:         payment.PayeeMethodPIXKey,
		Payee:               map[string]any{"key_type": "CPF", "key_value": "12345678901"},
		IdempotencyKey:      "approval-test-1",
	}))
	p2ID := uuid.New()
	require.NoError(t, api.Payments.Insert(ctx, &payment.Payment{
		ID:                  p2ID,
		Type:                payment.TypeTED,
		Status:              payment.StatusPrevalidated,
		Amount:              25000,
		Currency:            "BRL",
		PayerAccountID:      payerID,
		BeneficiarySnapshot: map[string]any{},
		PayeeMethod:         payment.PayeeMethodBankAccount,
		Payee:               map[string]any{"bank_code": "033", "agency": "0001", "account": "123"},
		IdempotencyKey:      "approval-test-2",
	}))

	// Create a run for today
	createResp := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/runs", map[string]string{
		"run_date": time.Now().Format("2006-01-02"),
	}, adminToken)
	defer createResp.Body.Close()
	require.Equal(t, nethttp.StatusCreated, createResp.StatusCode)

	var createBody map[string]any
	require.NoError(t, json.NewDecoder(createResp.Body).Decode(&createBody))
	runIDStr, _ := createBody["id"].(string)
	require.NotEmpty(t, runIDStr)

	// Attach both payments
	attachResp := doJSON(t, nethttp.MethodPost,
		api.BaseURL+"/v1/runs/"+runIDStr+"/attach",
		map[string]any{"payment_ids": []string{p1ID.String(), p2ID.String()}},
		adminToken,
	)
	defer attachResp.Body.Close()
	require.Equal(t, nethttp.StatusOK, attachResp.StatusCode)
	var attachBody map[string]any
	require.NoError(t, json.NewDecoder(attachResp.Body).Decode(&attachBody))
	require.Len(t, attachBody["attached"], 2)
	require.Empty(t, attachBody["rejected"])

	// Approve the run
	approveResp := doJSON(t, nethttp.MethodPost,
		api.BaseURL+"/v1/runs/"+runIDStr+"/approve", nil, adminToken,
	)
	defer approveResp.Body.Close()
	require.Equal(t, nethttp.StatusOK, approveResp.StatusCode)
	var approveBody map[string]any
	require.NoError(t, json.NewDecoder(approveResp.Body).Decode(&approveBody))
	require.Equal(t, "APPROVED", approveBody["status"])
	require.EqualValues(t, 2, approveBody["total_items"])
	require.EqualValues(t, 40000, approveBody["total_amount_cents"])
	require.EqualValues(t, 1, approveBody["pix_count"])
	require.EqualValues(t, 1, approveBody["ted_count"])

	// Both payments should now be APPROVED + have audit events.
	for _, id := range []uuid.UUID{p1ID, p2ID} {
		loaded, err := api.Payments.Get(ctx, id)
		require.NoError(t, err)
		require.Equal(t, payment.StatusApproved, loaded.Status)
		events, err := api.Events.ListForPayment(ctx, id)
		require.NoError(t, err)
		require.GreaterOrEqual(t, len(events), 1)
		require.Equal(t, "APPROVED", events[len(events)-1].ToStatus)
	}
}

func TestIntegration_HoldUnholdCancel(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedAdminKey(t, api)
	payerID := seedPayerAcct(t, api)
	ctx := context.Background()

	// Payment already APPROVED (shortcut the validation stages)
	pid := uuid.New()
	require.NoError(t, api.Payments.Insert(ctx, &payment.Payment{
		ID:                  pid,
		Type:                payment.TypePIX,
		Status:              payment.StatusApproved,
		Amount:              5000,
		Currency:            "BRL",
		PayerAccountID:      payerID,
		BeneficiarySnapshot: map[string]any{},
		PayeeMethod:         payment.PayeeMethodPIXKey,
		Payee:               map[string]any{"key_type": "EVP", "key_value": "xyz"},
		IdempotencyKey:      "hold-test-1",
	}))

	// Hold
	resp := doJSON(t, nethttp.MethodPost,
		api.BaseURL+"/v1/payments/"+pid.String()+"/hold",
		map[string]string{"reason": "need cnpj verification"},
		adminToken,
	)
	resp.Body.Close()
	require.Equal(t, nethttp.StatusNoContent, resp.StatusCode)
	loaded, _ := api.Payments.Get(ctx, pid)
	require.Equal(t, payment.StatusOnHold, loaded.Status)

	// Unhold
	resp = doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/payments/"+pid.String()+"/unhold", nil, adminToken)
	resp.Body.Close()
	require.Equal(t, nethttp.StatusNoContent, resp.StatusCode)
	loaded, _ = api.Payments.Get(ctx, pid)
	require.Equal(t, payment.StatusApproved, loaded.Status)

	// Cancel
	resp = doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/payments/"+pid.String()+"/cancel",
		map[string]string{"reason": "no longer needed"}, adminToken)
	resp.Body.Close()
	require.Equal(t, nethttp.StatusNoContent, resp.StatusCode)
	loaded, _ = api.Payments.Get(ctx, pid)
	require.Equal(t, payment.StatusCanceled, loaded.Status)
}

func TestIntegration_Admin_CreatePayerAccount_And_APIKey(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedAdminKey(t, api)

	// Create payer account
	resp := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/admin/payer-accounts", map[string]any{
		"bank_code":        "341",
		"agency":           "1234",
		"account_number":   "56789",
		"account_digit":    "0",
		"oauth_client_id":  "client-abc",
		"oauth_secret_ref": "secrets:itau-main",
		"label":            "itau-main-admin",
	}, adminToken)
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusCreated, resp.StatusCode)
	var body map[string]string
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&body))
	require.NotEmpty(t, body["id"])

	// Create API key
	keyResp := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/admin/api-keys", map[string]any{
		"label":  "erp-client-1",
		"scopes": []string{"payments:write", "payments:read"},
	}, adminToken)
	defer keyResp.Body.Close()
	require.Equal(t, nethttp.StatusCreated, keyResp.StatusCode)
	var keyBody map[string]any
	require.NoError(t, json.NewDecoder(keyResp.Body).Decode(&keyBody))
	token, _ := keyBody["token"].(string)
	require.Contains(t, token, "phk_")

	// Using the new key on /v1/payments should work for auth (missing fields -> 400)
	req := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/payments", map[string]any{}, token)
	defer req.Body.Close()
	require.NotEqual(t, nethttp.StatusUnauthorized, req.StatusCode, "new key should be valid for auth")
}

func TestIntegration_Admin_CreateBeneficiary(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedAdminKey(t, api)

	resp := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/admin/beneficiaries", map[string]any{
		"kind":            "SUPPLIER",
		"legal_name":      "ACME Fornecedor LTDA",
		"document_type":   "CNPJ",
		"document_number": "12345678000199",
		"tags":            []string{"fornecedor", "ti"},
	}, adminToken)
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusCreated, resp.StatusCode)
	var body map[string]string
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&body))
	benID := body["id"]
	require.NotEmpty(t, benID)

	// Add PIX key
	pixResp := doJSON(t, nethttp.MethodPost,
		api.BaseURL+"/v1/admin/beneficiaries/"+benID+"/pix-keys",
		map[string]any{"key_type": "CNPJ", "key_value": "12345678000199", "label": "principal"},
		adminToken,
	)
	defer pixResp.Body.Close()
	require.Equal(t, nethttp.StatusCreated, pixResp.StatusCode)
}
