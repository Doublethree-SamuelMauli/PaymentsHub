// Package banks contract_test verifies that every bank adapter honours the
// PaymentGateway contract under the same happy-path scenarios. It uses httptest
// servers tailored to each bank's documented endpoint layout (auth + PIX send +
// status + DICT). Run this with `go test ./internal/adapters/banks/...`.
package banks_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/bb"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/bradesco"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/btg"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/inter"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/santander"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/sicoob"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

// bankSetup describes how to stand up a fake server for a bank and how to
// build its gateway against that server.
type bankSetup struct {
	name     string
	code     string
	routes   map[string]http.HandlerFunc
	gateway  func(baseURL string) ports.PaymentGateway
	settled  payment.Status
}

func allBanks(t *testing.T) []bankSetup {
	t.Helper()
	tokenOK := func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"tkn","token_type":"bearer","expires_in":3600}`))
	}
	writeJSON := func(w http.ResponseWriter, body any) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(body)
	}
	nowRFC := time.Now().UTC().Format(time.RFC3339)

	return []bankSetup{
		{
			name: "bradesco", code: "237", settled: payment.StatusSettled,
			routes: map[string]http.HandlerFunc{
				"/auth/server/v1.1/token": tokenOK,
				"/v1/pix/envio": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"idTransacao": "bra-1", "endToEndId": "E2E", "status": "CONCLUIDO"})
				},
				"/v1/pix/envio/bra-1": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"idTransacao": "bra-1", "status": "LIQUIDADO", "dataLiquidacao": nowRFC})
				},
				"/v1/pix/dict/chaves/": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"titular": "ACME", "documento": "12345678000199", "status": "ATIVO"})
				},
			},
			gateway: func(base string) ports.PaymentGateway {
				return bradesco.NewClient(bradesco.Config{
					BaseURL: base, TokenURL: base + "/auth/server/v1.1/token",
					ClientID: "c", ClientSecret: "s", HTTPTimeout: 2 * time.Second,
				})
			},
		},
		{
			name: "inter", code: "077", settled: payment.StatusSettled,
			routes: map[string]http.HandlerFunc{
				"/oauth/v2/token": tokenOK,
				"/banking/v2/pix": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"codigoSolicitacao": "int-1", "endToEndId": "E", "status": "APROVADO"})
				},
				"/banking/v2/pix/int-1": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"codigoSolicitacao": "int-1", "status": "LIQUIDADO", "dataLiquidacao": nowRFC})
				},
				"/banking/v2/pix/chaves/": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"nomeCompleto": "Jose", "cpfCnpj": "11144477735", "status": "ATIVA"})
				},
			},
			gateway: func(base string) ports.PaymentGateway {
				return inter.NewClient(inter.Config{
					BaseURL: base, TokenURL: base + "/oauth/v2/token",
					ClientID: "c", ClientSecret: "s", AccountID: "conta-123", HTTPTimeout: 2 * time.Second,
				})
			},
		},
		{
			name: "santander", code: "033", settled: payment.StatusSettled,
			routes: map[string]http.HandlerFunc{
				"/auth/oauth/v2/token": tokenOK,
				"/pix_pagamentos/v1/envios": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"id": "sa-1", "endToEndId": "E", "status": "LIQUIDADO"})
				},
				"/pix_pagamentos/v1/envios/sa-1": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"id": "sa-1", "status": "LIQUIDADO", "dataLiquidacao": nowRFC})
				},
				"/pix_pagamentos/v1/chaves/": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"nomeTitular": "ACME", "cpfCnpj": "12345678000199", "status": "ATIVA"})
				},
			},
			gateway: func(base string) ports.PaymentGateway {
				return santander.NewClient(santander.Config{
					BaseURL: base, TokenURL: base + "/auth/oauth/v2/token",
					ClientID: "c", ClientSecret: "s", HTTPTimeout: 2 * time.Second,
				})
			},
		},
		{
			name: "bb", code: "001", settled: payment.StatusSettled,
			routes: map[string]http.HandlerFunc{
				"/oauth/token": tokenOK,
				"/pix-pagamentos/v2": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"idTransacao": "bb-1", "endToEndId": "E", "status": "LIQUIDADO"})
				},
				"/pix-pagamentos/v2/bb-1": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"idTransacao": "bb-1", "status": "LIQUIDADO", "dataLiquidacao": nowRFC})
				},
				"/pix-dict/v1/chaves/": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"nomeCorrentista": "ACME", "cpfCnpjCorrentista": "12345678000199", "status": "ATIVA"})
				},
			},
			gateway: func(base string) ports.PaymentGateway {
				return bb.NewClient(bb.Config{
					BaseURL: base, TokenURL: base + "/oauth/token",
					ClientID: "c", ClientSecret: "s", GWAppKey: "k", HTTPTimeout: 2 * time.Second,
				})
			},
		},
		{
			name: "sicoob", code: "756", settled: payment.StatusSettled,
			routes: map[string]http.HandlerFunc{
				"/token": tokenOK,
				"/pix-pagamentos/v2/envios": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"idTransacao": "sc-1", "endToEndId": "E", "status": "CONFIRMADO"})
				},
				"/pix-pagamentos/v2/envios/sc-1": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"idTransacao": "sc-1", "status": "CONFIRMADO", "dataLiquidacao": nowRFC})
				},
				"/pix-dict/v2/chaves/": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"nomeTitular": "ACME", "cpfCnpj": "12345678000199", "status": "ATIVA"})
				},
			},
			gateway: func(base string) ports.PaymentGateway {
				return sicoob.NewClient(sicoob.Config{
					BaseURL: base, TokenURL: base + "/token",
					ClientID: "c", ClientSecret: "s", HTTPTimeout: 2 * time.Second,
				})
			},
		},
		{
			name: "btg", code: "208", settled: payment.StatusSettled,
			routes: map[string]http.HandlerFunc{
				"/token": tokenOK,
				"/api-corp/pix-payments/v1/payments": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"paymentId": "btg-1", "endToEndId": "E", "status": "SETTLED"})
				},
				"/api-corp/pix-payments/v1/payments/btg-1": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"paymentId": "btg-1", "status": "SETTLED", "settledAt": nowRFC})
				},
				"/api-corp/pix-dict/v1/keys/": func(w http.ResponseWriter, _ *http.Request) {
					writeJSON(w, map[string]any{"holderName": "ACME", "holderDocument": "12345678000199", "status": "ACTIVE"})
				},
			},
			gateway: func(base string) ports.PaymentGateway {
				return btg.NewClient(btg.Config{
					BaseURL: base, TokenURL: base + "/token",
					ClientID: "c", ClientSecret: "s", HTTPTimeout: 2 * time.Second,
				})
			},
		},
	}
}

// startServer builds a mux that serves bank.routes with path-prefix fallback
// (so /pix/dict/chaves/{chave} matches /pix/dict/chaves/).
func startServer(routes map[string]http.HandlerFunc) *httptest.Server {
	mux := http.NewServeMux()
	for path, h := range routes {
		mux.HandleFunc(path, h)
	}
	return httptest.NewServer(mux)
}

func TestContract_AllGateways_SendPixReturnsSettled(t *testing.T) {
	for _, bk := range allBanks(t) {
		bk := bk
		t.Run(bk.name, func(t *testing.T) {
			srv := startServer(bk.routes)
			t.Cleanup(srv.Close)
			gw := bk.gateway(srv.URL)

			res, err := gw.SendPix(context.Background(), ports.SendPixRequest{
				IdempotencyKey: "k",
				Amount:         money.Cents(100),
				PayeeKeyType:   "CNPJ",
				PayeeKeyValue:  "12345678000199",
				Description:    "contract test",
			})
			require.NoError(t, err, "%s.SendPix", bk.name)
			require.NotEmpty(t, res.BankReference, "%s: bank_reference should be set", bk.name)
			require.Equal(t, bk.settled, res.Status, "%s.SendPix should settle on happy path", bk.name)
			require.False(t, res.SubmittedAt.IsZero(), "%s: submitted_at", bk.name)
		})
	}
}

func TestContract_AllGateways_PrevalidatePix(t *testing.T) {
	for _, bk := range allBanks(t) {
		bk := bk
		t.Run(bk.name, func(t *testing.T) {
			srv := startServer(bk.routes)
			t.Cleanup(srv.Close)
			gw := bk.gateway(srv.URL)

			res, err := gw.PrevalidatePix(context.Background(), ports.PrevalidatePixRequest{
				KeyType: "CNPJ", KeyValue: "12345678000199",
			})
			require.NoError(t, err, "%s.PrevalidatePix", bk.name)
			require.Equal(t, "OK", res.Verdict, "%s: DICT lookup should say OK", bk.name)
		})
	}
}

func TestContract_AllGateways_GetPixStatus(t *testing.T) {
	ids := map[string]string{
		"bradesco":  "bra-1",
		"inter":     "int-1",
		"santander": "sa-1",
		"bb":        "bb-1",
		"sicoob":    "sc-1",
		"btg":       "btg-1",
	}
	for _, bk := range allBanks(t) {
		bk := bk
		t.Run(bk.name, func(t *testing.T) {
			srv := startServer(bk.routes)
			t.Cleanup(srv.Close)
			gw := bk.gateway(srv.URL)

			ref := ids[bk.name]
			st, err := gw.GetPixStatus(context.Background(), ref)
			require.NoError(t, err, "%s.GetPixStatus(%s)", bk.name, ref)
			require.Equal(t, bk.settled, st.Status, "%s: expected SETTLED", bk.name)
			require.NotNil(t, st.SettledAt, "%s: settled_at should be set", bk.name)
		})
	}
}
