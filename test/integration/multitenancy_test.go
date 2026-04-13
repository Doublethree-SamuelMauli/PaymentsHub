//go:build integration

package integration_test

import (
	"context"
	"encoding/json"
	"io"
	nethttp "net/http"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/client"
	"github.com/vanlink-ltda/paymentshub/internal/testsupport"
)

func TestIntegration_MultiTenancy_CreateClient(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedAdminKey(t, api)

	resp := doJSON(t, nethttp.MethodPost, api.BaseURL+"/v1/admin/clients", map[string]any{
		"name":            "Empresa Alpha LTDA",
		"document_type":   "CNPJ",
		"document_number": "11222333000144",
	}, adminToken)
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusCreated, resp.StatusCode)

	var body map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&body))
	require.NotEmpty(t, body["id"])
	require.Contains(t, body["webhook_secret"].(string), "whsec_")
}

func TestIntegration_MultiTenancy_TenantIsolation(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	ctx := context.Background()

	// Create two clients
	clientA := &client.Client{
		ID: uuid.New(), Name: "Client A", DocumentType: "CNPJ",
		DocumentNumber: "11111111000100", Active: true,
	}
	clientB := &client.Client{
		ID: uuid.New(), Name: "Client B", DocumentType: "CNPJ",
		DocumentNumber: "22222222000100", Active: true,
	}
	require.NoError(t, api.Clients.Insert(ctx, clientA))
	require.NoError(t, api.Clients.Insert(ctx, clientB))

	// Create API keys bound to each client
	tokenA := "token-client-a-xyz"
	tokenB := "token-client-b-xyz"
	require.NoError(t, api.APIKeys.Insert(ctx, ports.APIKey{
		ID: uuid.New(), ClientID: &clientA.ID, Label: "client-a-key",
		KeyHash: mw.HashToken(tokenA), Scopes: []string{"payments:write"}, Active: true,
	}))
	require.NoError(t, api.APIKeys.Insert(ctx, ports.APIKey{
		ID: uuid.New(), ClientID: &clientB.ID, Label: "client-b-key",
		KeyHash: mw.HashToken(tokenB), Scopes: []string{"payments:write"}, Active: true,
	}))

	// Seed a payer account
	payerID := seedPayerAcct(t, api)

	// Client A creates a payment
	bodyA, _ := json.Marshal(map[string]any{
		"type": "PIX", "amount_cents": 10000,
		"payer_account_id": payerID.String(),
		"payee_method": "PIX_KEY",
		"payee": map[string]string{"key_type": "EVP", "key_value": "abc"},
	})
	respA := postPayment(t, api, bodyA, map[string]string{
		"Authorization":   "Bearer " + tokenA,
		"Idempotency-Key": "tenant-a-pay-1",
	})
	defer respA.Body.Close()
	require.Equal(t, nethttp.StatusCreated, respA.StatusCode)
	rawA, _ := io.ReadAll(respA.Body)
	var payA map[string]any
	require.NoError(t, json.Unmarshal(rawA, &payA))

	// Client B creates a payment
	bodyB, _ := json.Marshal(map[string]any{
		"type": "TED", "amount_cents": 20000,
		"payer_account_id": payerID.String(),
		"payee_method": "BANK_ACCOUNT",
		"payee": map[string]string{"bank_code": "033", "agency": "0001", "account": "123"},
	})
	respB := postPayment(t, api, bodyB, map[string]string{
		"Authorization":   "Bearer " + tokenB,
		"Idempotency-Key": "tenant-b-pay-1",
	})
	defer respB.Body.Close()
	require.Equal(t, nethttp.StatusCreated, respB.StatusCode)
	rawB, _ := io.ReadAll(respB.Body)
	var payB map[string]any
	require.NoError(t, json.Unmarshal(rawB, &payB))

	// Verify payments have different client_ids in DB
	paymentA, err := api.Payments.Get(ctx, uuid.MustParse(payA["id"].(string)))
	require.NoError(t, err)
	require.NotNil(t, paymentA.ClientID)
	require.Equal(t, clientA.ID, *paymentA.ClientID)

	paymentB, err := api.Payments.Get(ctx, uuid.MustParse(payB["id"].(string)))
	require.NoError(t, err)
	require.NotNil(t, paymentB.ClientID)
	require.Equal(t, clientB.ID, *paymentB.ClientID)

	// Client A cannot be Client B (different client_ids)
	require.NotEqual(t, *paymentA.ClientID, *paymentB.ClientID)
}

func TestIntegration_MultiTenancy_ConfigureWebhook(t *testing.T) {
	api := testsupport.SpawnAPIWithDB(t)
	seedAdminKey(t, api)
	ctx := context.Background()

	c := &client.Client{
		ID: uuid.New(), Name: "Webhook Corp", DocumentType: "CNPJ",
		DocumentNumber: "33333333000100", Active: true,
	}
	require.NoError(t, api.Clients.Insert(ctx, c))

	resp := doJSON(t, nethttp.MethodPost,
		api.BaseURL+"/v1/admin/clients/"+c.ID.String()+"/webhook",
		map[string]string{"webhook_url": "https://example.com/webhook"},
		adminToken,
	)
	defer resp.Body.Close()
	require.Equal(t, nethttp.StatusOK, resp.StatusCode)

	var body map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&body))
	require.Equal(t, "https://example.com/webhook", body["webhook_url"])
	require.Contains(t, body["webhook_secret"].(string), "whsec_")

	// Verify in DB
	loaded, err := api.Clients.Get(ctx, c.ID)
	require.NoError(t, err)
	require.Equal(t, "https://example.com/webhook", loaded.WebhookURL)
	require.NotEmpty(t, loaded.WebhookSecret)
}
