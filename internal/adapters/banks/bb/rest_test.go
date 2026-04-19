package bb_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/bb"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

func TestBB_SendPix_AppKeyForwarded(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/oauth/token", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"access_token":"bb","expires_in":3600}`))
	})
	mux.HandleFunc("/pix-pagamentos/v2", func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "my-gw-key", r.URL.Query().Get("gw-app-key"))
		_, _ = w.Write([]byte(`{"idTransacao":"bb-1","endToEndId":"E","status":"LIQUIDADO"}`))
	})
	srv := httptest.NewServer(mux)
	defer srv.Close()

	cli := bb.NewClient(bb.Config{
		BaseURL:      srv.URL,
		TokenURL:     srv.URL + "/oauth/token",
		ClientID:     "c", ClientSecret: "s",
		GWAppKey:    "my-gw-key",
		HTTPTimeout: 2 * time.Second,
	})
	res, err := cli.SendPix(context.Background(), ports.SendPixRequest{
		IdempotencyKey: "k", Amount: money.Cents(100),
		PayeeKeyValue: "chave", PayeeKeyType: "CNPJ",
	})
	require.NoError(t, err)
	require.Equal(t, payment.StatusSettled, res.Status)
	require.Equal(t, "bb-1", res.BankReference)
}
