package banks_test

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
)

type fakeGateway struct{}

func (fakeGateway) PrevalidatePix(ctx context.Context, req ports.PrevalidatePixRequest) (*ports.PrevalidatePixResult, error) {
	return &ports.PrevalidatePixResult{Verdict: "OK"}, nil
}
func (fakeGateway) SendPix(ctx context.Context, req ports.SendPixRequest) (*ports.SendPixResult, error) {
	return &ports.SendPixResult{BankReference: "ok"}, nil
}
func (fakeGateway) GetPixStatus(ctx context.Context, ref string) (*ports.PixStatusResult, error) {
	return &ports.PixStatusResult{BankReference: ref}, nil
}

func TestRegistry_RegisterAndLookup(t *testing.T) {
	r := banks.NewRegistry()
	r.Register("341", fakeGateway{})

	gw, err := r.Lookup("341")
	require.NoError(t, err)
	require.NotNil(t, gw)

	res, err := gw.SendPix(context.Background(), ports.SendPixRequest{})
	require.NoError(t, err)
	require.Equal(t, "ok", res.BankReference)
}

func TestRegistry_UnknownBank(t *testing.T) {
	r := banks.NewRegistry()
	_, err := r.Lookup("999")
	require.Error(t, err)
	require.True(t, errors.Is(err, banks.ErrUnknownBank))
}

func TestSupportedBankCodes(t *testing.T) {
	codes := banks.SupportedBankCodes()
	require.Contains(t, codes, "341")
	require.Contains(t, codes, "237")
	require.Contains(t, codes, "033")
	require.Contains(t, codes, "001")
	require.Contains(t, codes, "104")
	require.Contains(t, codes, "077")
	require.Contains(t, codes, "756")
	require.Contains(t, codes, "208")
	require.Len(t, codes, 8)
}
