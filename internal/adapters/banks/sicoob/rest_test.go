package sicoob_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/sicoob"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

func TestSicoob_SendPix_Happy(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/token", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"access_token":"sc","expires_in":3600}`))
	})
	mux.HandleFunc("/pix-pagamentos/v2/envios", func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "c", r.Header.Get("client_id"))
		_, _ = w.Write([]byte(`{"idTransacao":"sc-1","endToEndId":"E","status":"CONFIRMADO"}`))
	})
	srv := httptest.NewServer(mux)
	defer srv.Close()

	cli := sicoob.NewClient(sicoob.Config{
		BaseURL: srv.URL, TokenURL: srv.URL + "/token",
		ClientID: "c", ClientSecret: "s",
		HTTPTimeout: 2 * time.Second,
	})
	res, err := cli.SendPix(context.Background(), ports.SendPixRequest{
		IdempotencyKey: "k", Amount: money.Cents(100),
		PayeeKeyValue: "chave", PayeeKeyType: "CPF",
	})
	require.NoError(t, err)
	require.Equal(t, payment.StatusSettled, res.Status)
	require.Equal(t, "sc-1", res.BankReference)
}
