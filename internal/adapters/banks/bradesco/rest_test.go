package bradesco_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/bradesco"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

func newServer(t *testing.T) (*httptest.Server, *struct {
	TokenCalls int
	PixCalls   int
}) {
	counters := &struct {
		TokenCalls int
		PixCalls   int
	}{}
	mux := http.NewServeMux()
	mux.HandleFunc("/auth/server/v1.1/token", func(w http.ResponseWriter, _ *http.Request) {
		counters.TokenCalls++
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"tkn","token_type":"bearer","expires_in":3600}`))
	})
	mux.HandleFunc("/v1/pix/envio", func(w http.ResponseWriter, r *http.Request) {
		counters.PixCalls++
		require.Equal(t, "Bearer tkn", r.Header.Get("Authorization"))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"idTransacao":"bra-1","endToEndId":"E2E-1","status":"CONCLUIDO"}`))
	})
	mux.HandleFunc("/v1/pix/envio/bra-1", func(w http.ResponseWriter, _ *http.Request) {
		resp := map[string]any{
			"idTransacao":    "bra-1",
			"endToEndId":     "E2E-1",
			"status":         "LIQUIDADO",
			"dataLiquidacao": time.Now().UTC().Format(time.RFC3339),
		}
		_ = json.NewEncoder(w).Encode(resp)
	})
	mux.HandleFunc("/v1/pix/dict/chaves/", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"titular":"ACME","documento":"12345678000199","status":"ATIVO"}`))
	})
	return httptest.NewServer(mux), counters
}

func TestBradesco_SendPix_Happy(t *testing.T) {
	srv, counters := newServer(t)
	defer srv.Close()

	cli := bradesco.NewClient(bradesco.Config{
		BaseURL:      srv.URL,
		TokenURL:     srv.URL + "/auth/server/v1.1/token",
		ClientID:     "cid",
		ClientSecret: "sec",
		HTTPTimeout:  2 * time.Second,
	})

	res, err := cli.SendPix(context.Background(), ports.SendPixRequest{
		IdempotencyKey: "k1",
		Amount:         money.Cents(5000),
		PayeeKeyValue:  "12345678000199",
		PayeeKeyType:   "CNPJ",
	})
	require.NoError(t, err)
	require.Equal(t, "bra-1", res.BankReference)
	require.Equal(t, payment.StatusSettled, res.Status)
	require.Equal(t, 1, counters.PixCalls)
}

func TestBradesco_GetStatus(t *testing.T) {
	srv, _ := newServer(t)
	defer srv.Close()

	cli := bradesco.NewClient(bradesco.Config{
		BaseURL:      srv.URL,
		TokenURL:     srv.URL + "/auth/server/v1.1/token",
		ClientID:     "cid",
		ClientSecret: "sec",
		HTTPTimeout:  2 * time.Second,
	})
	res, err := cli.GetPixStatus(context.Background(), "bra-1")
	require.NoError(t, err)
	require.Equal(t, payment.StatusSettled, res.Status)
	require.NotNil(t, res.SettledAt)
}

func TestBradesco_PrevalidatePix(t *testing.T) {
	srv, _ := newServer(t)
	defer srv.Close()

	cli := bradesco.NewClient(bradesco.Config{
		BaseURL:      srv.URL,
		TokenURL:     srv.URL + "/auth/server/v1.1/token",
		ClientID:     "cid",
		ClientSecret: "sec",
		HTTPTimeout:  2 * time.Second,
	})
	res, err := cli.PrevalidatePix(context.Background(), ports.PrevalidatePixRequest{
		KeyType:  "CNPJ",
		KeyValue: "12345678000199",
	})
	require.NoError(t, err)
	require.Equal(t, "OK", res.Verdict)
	require.Equal(t, "ACME", res.OwnerName)
}
