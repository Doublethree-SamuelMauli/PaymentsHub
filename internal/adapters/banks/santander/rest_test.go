package santander_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/santander"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

func TestSantander_SendPix_Happy(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/auth/oauth/v2/token", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"access_token":"sa","expires_in":3600}`))
	})
	mux.HandleFunc("/pix_pagamentos/v1/envios", func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "Bearer sa", r.Header.Get("Authorization"))
		_, _ = w.Write([]byte(`{"id":"sa-1","endToEndId":"E","status":"LIQUIDADO"}`))
	})
	srv := httptest.NewServer(mux)
	defer srv.Close()

	cli := santander.NewClient(santander.Config{
		BaseURL:      srv.URL,
		TokenURL:     srv.URL + "/auth/oauth/v2/token",
		ClientID:     "c", ClientSecret: "s",
		HTTPTimeout: 2 * time.Second,
	})
	res, err := cli.SendPix(context.Background(), ports.SendPixRequest{
		IdempotencyKey: "k", Amount: money.Cents(100),
		PayeeKeyType: "CNPJ", PayeeKeyValue: "12345678000199",
	})
	require.NoError(t, err)
	require.Equal(t, "sa-1", res.BankReference)
	require.Equal(t, payment.StatusSettled, res.Status)
}
