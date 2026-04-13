package logging_test

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/platform/logging"
)

func TestRedactCPF(t *testing.T) {
	require.Equal(t, "123***01", logging.RedactCPF("12345678901"))
	require.Equal(t, "123***01", logging.RedactCPF("123.456.789-01"))
	require.Equal(t, "***", logging.RedactCPF("invalid"))
}

func TestRedactCNPJ(t *testing.T) {
	require.Equal(t, "12***99", logging.RedactCNPJ("12345678000199"))
	require.Equal(t, "12***99", logging.RedactCNPJ("12.345.678/0001-99"))
	require.Equal(t, "***", logging.RedactCNPJ("short"))
}
