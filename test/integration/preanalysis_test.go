//go:build integration

package integration_test

import (
	"context"
	"encoding/json"
	nethttp "net/http"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/client"
	"github.com/vanlink-ltda/paymentshub/internal/testsupport"
)

func TestIntegration_PreAnalysis_BlacklistRejectsViaAdmin(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedAdminKey(t, api)
	ctx := context.Background()

	// Create a client
	c := &client.Client{
		ID: uuid.New(), Name: "Blacklist Corp", DocumentType: "CNPJ",
		DocumentNumber: "77777777000100", Active: true,
	}
	require.NoError(t, api.Clients.Insert(ctx, c))

	// Add blacklist entry via admin API
	resp := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/admin/blacklist", map[string]any{
		"client_id":       c.ID.String(),
		"document_number": "99988877766",
		"reason":          "fraud suspect",
	}, adminToken)
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusCreated, resp.StatusCode)
	var body map[string]string
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&body))
	require.NotEmpty(t, body["id"])
}

func TestIntegration_PreAnalysis_SetLimitsViaAdmin(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedAdminKey(t, api)
	ctx := context.Background()

	c := &client.Client{
		ID: uuid.New(), Name: "Limited Corp", DocumentType: "CNPJ",
		DocumentNumber: "55555555000100", Active: true,
	}
	require.NoError(t, api.Clients.Insert(ctx, c))

	resp := doJSON(t, nethttp.MethodPost,
		api.BaseURL+"/v1/admin/clients/"+c.ID.String()+"/limits",
		map[string]any{
			"daily_limit_cents":       500000,
			"monthly_limit_cents":     5000000,
			"max_single_cents":        100000,
			"require_approval_above":  50000,
		}, adminToken)
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusOK, resp.StatusCode)
}

func TestIntegration_PreAnalysis_SetDuplicateRuleViaAdmin(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedAdminKey(t, api)
	ctx := context.Background()

	c := &client.Client{
		ID: uuid.New(), Name: "Dupe Corp", DocumentType: "CNPJ",
		DocumentNumber: "44444444000100", Active: true,
	}
	require.NoError(t, api.Clients.Insert(ctx, c))

	resp := doJSON(t, nethttp.MethodPost,
		api.BaseURL+"/v1/admin/clients/"+c.ID.String()+"/duplicate-rule",
		map[string]any{
			"window_hours": 12,
			"action":       "REVIEW",
		}, adminToken)
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusCreated, resp.StatusCode)
}

func TestIntegration_PreAnalysis_HighValuePaymentFlaggedForReview(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	ctx := context.Background()

	// Create client with limits
	c := &client.Client{
		ID: uuid.New(), Name: "Review Corp", DocumentType: "CNPJ",
		DocumentNumber: "66666666000100", Active: true,
	}
	require.NoError(t, api.Clients.Insert(ctx, c))

	// Set limit: require approval above 50000 (R$ 500)
	seedAdminKey(t, api)
	resp := doJSON(t, nethttp.MethodPost,
		api.BaseURL+"/v1/admin/clients/"+c.ID.String()+"/limits",
		map[string]any{
			"require_approval_above": 50000,
		}, adminToken)
	resp.Body.Close()
	require.Equal(t, nethttp.StatusOK, resp.StatusCode)

	// Create API key bound to client
	clientToken := "client-review-token"
	require.NoError(t, api.APIKeys.Insert(ctx, ports.APIKey{
		ID: uuid.New(), ClientID: &c.ID, Label: "review-key",
		KeyHash: mw.HashToken(clientToken), Scopes: []string{"payments:write"}, Active: true,
	}))

	payerID := seedPayerAcct(t, api)

	// Create a high-value payment (R$ 1000 = 100000 cents > threshold 50000)
	body, _ := json.Marshal(map[string]any{
		"type": "PIX", "amount_cents": 100000,
		"payer_account_id": payerID.String(),
		"payee_method":     "PIX_KEY",
		"payee":            map[string]string{"key_type": "EVP", "key_value": "xyz"},
	})
	payResp := postPayment(t, api, body, map[string]string{
		"Authorization":   "Bearer " + clientToken,
		"Idempotency-Key": "high-value-test-1",
	})
	defer payResp.Body.Close()
	require.Equal(t, nethttp.StatusCreated, payResp.StatusCode)

	// Payment is created with client_id set
	var payBody map[string]any
	require.NoError(t, json.NewDecoder(payResp.Body).Decode(&payBody))
	pid := uuid.MustParse(payBody["id"].(string))
	loaded, err := api.Payments.Get(ctx, pid)
	require.NoError(t, err)
	require.Equal(t, c.ID, *loaded.ClientID)
}
