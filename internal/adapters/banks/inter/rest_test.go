package inter_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/inter"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

func newInterServer(t *testing.T) *httptest.Server {
	mux := http.NewServeMux()
	mux.HandleFunc("/oauth/v2/token", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"inter-tkn","token_type":"bearer","expires_in":3600}`))
	})
	mux.HandleFunc("/banking/v2/pix", func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "Bearer inter-tkn", r.Header.Get("Authorization"))
		require.Equal(t, "conta-123", r.Header.Get("x-conta-corrente"))
		_, _ = w.Write([]byte(`{"codigoSolicitacao":"int-1","endToEndId":"E2E","status":"APROVADO"}`))
	})
	mux.HandleFunc("/banking/v2/pix/chaves/", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"nomeCompleto":"Jose","cpfCnpj":"11144477735","status":"ATIVA"}`))
	})
	return httptest.NewServer(mux)
}

func TestInter_SendPix(t *testing.T) {
	srv := newInterServer(t)
	defer srv.Close()

	cli := inter.NewClient(inter.Config{
		BaseURL:      srv.URL,
		TokenURL:     srv.URL + "/oauth/v2/token",
		ClientID:     "c", ClientSecret: "s",
		AccountID:   "conta-123",
		HTTPTimeout: 2 * time.Second,
	})
	res, err := cli.SendPix(context.Background(), ports.SendPixRequest{
		IdempotencyKey: "k1",
		Amount:         money.Cents(1000),
		PayeeKeyValue:  "11144477735",
		PayeeKeyType:   "CPF",
	})
	require.NoError(t, err)
	require.Equal(t, "int-1", res.BankReference)
	require.Equal(t, payment.StatusSettled, res.Status)
}

func TestInter_PrevalidatePix(t *testing.T) {
	srv := newInterServer(t)
	defer srv.Close()

	cli := inter.NewClient(inter.Config{
		BaseURL:      srv.URL,
		TokenURL:     srv.URL + "/oauth/v2/token",
		ClientID:     "c", ClientSecret: "s",
		HTTPTimeout: 2 * time.Second,
	})
	res, err := cli.PrevalidatePix(context.Background(), ports.PrevalidatePixRequest{
		KeyType: "CPF", KeyValue: "11144477735",
	})
	require.NoError(t, err)
	require.Equal(t, "OK", res.Verdict)
	require.Equal(t, "Jose", res.OwnerName)
}
