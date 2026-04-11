package money_test

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
)

func TestCents_Arithmetic(t *testing.T) {
	a := money.Cents(15000)
	b := money.Cents(2500)
	require.Equal(t, money.Cents(17500), a.Add(b))
	require.Equal(t, money.Cents(12500), a.Sub(b))
	require.True(t, a.IsPositive())
	require.False(t, money.Cents(0).IsPositive())
	require.True(t, money.Cents(0).IsZero())
}

func TestFormatBRL(t *testing.T) {
	cases := []struct {
		in   money.Cents
		want string
	}{
		{0, "R$ 0,00"},
		{1, "R$ 0,01"},
		{100, "R$ 1,00"},
		{12345, "R$ 123,45"},
		{123456, "R$ 1.234,56"},
		{1234567890, "R$ 12.345.678,90"},
		{-5099, "-R$ 50,99"},
	}
	for _, tc := range cases {
		require.Equal(t, tc.want, tc.in.FormatBRL(), "case %d", tc.in)
	}
}
