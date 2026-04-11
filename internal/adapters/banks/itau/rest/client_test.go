package rest_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/itau/rest"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
	"github.com/vanlink-ltda/paymentshub/internal/testsupport"
)

func newClient(t *testing.T, fake *testsupport.FakeItauServer) *rest.Client {
	t.Helper()
	return rest.NewClient(rest.Config{
		BaseURL:        fake.URL(),
		TokenURL:       fake.URL() + "/oauth/token",
		OAuthClientID:  "client-x",
		OAuthSecret:    "secret-x",
		Scope:          "pagamentos",
		HTTPTimeout:    5 * time.Second,
		MaxRetries:     3,
		InitialBackoff: 10 * time.Millisecond,
		BreakerName:    t.Name(),
	})
}

func TestClient_SendPix_HappyPath(t *testing.T) {
	fake := testsupport.NewFakeItau(t)
	client := newClient(t, fake)

	result, err := client.SendPix(context.Background(), ports.SendPixRequest{
		IdempotencyKey: "idem-1",
		Amount:         money.Cents(15000),
		Description:    "pagamento teste",
		PayeeKeyType:   "CNPJ",
		PayeeKeyValue:  "12345678000199",
	})
	require.NoError(t, err)
	require.Equal(t, "cod-idem-1", result.BankReference)
	require.Equal(t, "E12345678idem-1", result.EndToEndID)
	require.Equal(t, payment.StatusSettled, result.Status)
}

func TestClient_GetPixStatus_HappyPath(t *testing.T) {
	fake := testsupport.NewFakeItau(t)
	client := newClient(t, fake)

	result, err := client.GetPixStatus(context.Background(), "some-bank-ref")
	require.NoError(t, err)
	require.Equal(t, "some-bank-ref", result.BankReference)
	require.Equal(t, payment.StatusSettled, result.Status)
	require.NotNil(t, result.SettledAt)
}

func TestClient_PrevalidatePix_HappyPath(t *testing.T) {
	fake := testsupport.NewFakeItau(t)
	client := newClient(t, fake)

	result, err := client.PrevalidatePix(context.Background(), ports.PrevalidatePixRequest{
		KeyType:  "CNPJ",
		KeyValue: "12345678000199",
	})
	require.NoError(t, err)
	require.Equal(t, "OK", result.Verdict)
	require.Equal(t, "ACME Fornecedor LTDA", result.OwnerName)
}

func TestClient_Retry_On500(t *testing.T) {
	fake := testsupport.NewFakeItau(t)
	calls := 0
	fake.OverrideFn["POST /cash-management/v2/pix"] = func(w http.ResponseWriter, _ *http.Request) {
		calls++
		if calls < 3 {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"error":"oops"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"codigoSolicitacao":"retry-ok","status":"APROVADO","endToEndId":"e2e-1"}`))
	}

	client := newClient(t, fake)
	result, err := client.SendPix(context.Background(), ports.SendPixRequest{
		IdempotencyKey: "idem-retry",
		Amount:         money.Cents(1000),
		PayeeKeyValue:  "abc",
	})
	require.NoError(t, err)
	require.Equal(t, "retry-ok", result.BankReference)
	require.GreaterOrEqual(t, calls, 3)
}

func TestClient_NoRetry_On400(t *testing.T) {
	fake := testsupport.NewFakeItau(t)
	calls := 0
	fake.OverrideFn["POST /cash-management/v2/pix"] = func(w http.ResponseWriter, _ *http.Request) {
		calls++
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error":"invalid chave"}`))
	}

	client := newClient(t, fake)
	_, err := client.SendPix(context.Background(), ports.SendPixRequest{
		IdempotencyKey: "idem-400",
		Amount:         money.Cents(1000),
		PayeeKeyValue:  "bad",
	})
	require.Error(t, err)
	require.True(t, errors.Is(err, rest.ErrRejectedByBank))
	require.Equal(t, 1, calls, "4xx must not retry")
}

func TestTokenSource_CachesAcrossCalls(t *testing.T) {
	fake := testsupport.NewFakeItau(t)
	tokenCalls := 0
	fake.OverrideFn["POST /oauth/token"] = func(w http.ResponseWriter, _ *http.Request) {
		tokenCalls++
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"cached","token_type":"bearer","expires_in":3600}`))
	}

	httpClient := &http.Client{Timeout: 2 * time.Second}
	ts := rest.NewTokenSource(httpClient, fake.URL()+"/oauth/token", "c", "s", "scope")
	t1, err := ts.Token(context.Background())
	require.NoError(t, err)
	require.Equal(t, "cached", t1)
	t2, err := ts.Token(context.Background())
	require.NoError(t, err)
	require.Equal(t, "cached", t2)
	require.Equal(t, 1, tokenCalls)
}

func TestClient_AuthFailure(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/oauth/token" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
	}))
	defer srv.Close()

	client := rest.NewClient(rest.Config{
		BaseURL:        srv.URL,
		TokenURL:       srv.URL + "/oauth/token",
		OAuthClientID:  "bad",
		OAuthSecret:    "bad",
		HTTPTimeout:    2 * time.Second,
		MaxRetries:     2,
		InitialBackoff: 5 * time.Millisecond,
		BreakerName:    t.Name(),
	})
	_, err := client.SendPix(context.Background(), ports.SendPixRequest{
		IdempotencyKey: "k", Amount: 1, PayeeKeyValue: "x",
	})
	require.Error(t, err)
	require.True(t, errors.Is(err, rest.ErrAuthFailed))
}
