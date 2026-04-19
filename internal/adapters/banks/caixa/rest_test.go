package caixa_test

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/caixa"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
)

func TestCaixa_SendPix_RoutesToBatch(t *testing.T) {
	cli := caixa.NewClient(caixa.Config{})
	_, err := cli.SendPix(context.Background(), ports.SendPixRequest{})
	require.True(t, errors.Is(err, caixa.ErrUseBatch))
}

func TestCaixa_Prevalidate_Warn(t *testing.T) {
	cli := caixa.NewClient(caixa.Config{})
	res, err := cli.PrevalidatePix(context.Background(), ports.PrevalidatePixRequest{
		KeyType: "CNPJ", KeyValue: "12345678000199",
	})
	require.NoError(t, err)
	require.Equal(t, "WARN", res.Verdict)
}
