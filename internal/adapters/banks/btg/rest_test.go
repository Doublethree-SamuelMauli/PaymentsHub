package btg_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/btg"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

func TestBTG_SendPix_Happy(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/token", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"access_token":"btg","expires_in":3600}`))
	})
	mux.HandleFunc("/api-corp/pix-payments/v1/payments", func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "Bearer btg", r.Header.Get("Authorization"))
		require.Equal(t, "k", r.Header.Get("X-Idempotency-Key"))
		_, _ = w.Write([]byte(`{"paymentId":"btg-1","endToEndId":"E","status":"SETTLED"}`))
	})
	srv := httptest.NewServer(mux)
	defer srv.Close()

	cli := btg.NewClient(btg.Config{
		BaseURL: srv.URL, TokenURL: srv.URL + "/token",
		ClientID: "c", ClientSecret: "s",
		HTTPTimeout: 2 * time.Second,
	})
	res, err := cli.SendPix(context.Background(), ports.SendPixRequest{
		IdempotencyKey: "k", Amount: money.Cents(100),
		PayeeKeyValue: "chave", PayeeKeyType: "CNPJ",
	})
	require.NoError(t, err)
	require.Equal(t, payment.StatusSettled, res.Status)
	require.Equal(t, "btg-1", res.BankReference)
}
