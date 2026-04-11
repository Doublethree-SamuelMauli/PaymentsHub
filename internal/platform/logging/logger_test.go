package logging_test

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/platform/logging"
)

func TestNewLogger_OutputsJSONWithBaseFields(t *testing.T) {
	var buf bytes.Buffer
	logger := logging.NewLogger(logging.Options{
		Env:     "test",
		Level:   "info",
		Service: "paymentshub-api",
		Writer:  &buf,
	})

	logger.Info("hello", slog.String("payment_id", "abc-123"))

	var entry map[string]any
	require.NoError(t, json.Unmarshal(buf.Bytes(), &entry))
	require.Equal(t, "hello", entry["msg"])
	require.Equal(t, "paymentshub-api", entry["service"])
	require.Equal(t, "test", entry["env"])
	require.Equal(t, "abc-123", entry["payment_id"])
	require.Contains(t, entry, "time")
	require.Equal(t, "INFO", entry["level"])
}

func TestNewLogger_RespectsLevel(t *testing.T) {
	var buf bytes.Buffer
	logger := logging.NewLogger(logging.Options{
		Env:     "test",
		Level:   "warn",
		Service: "paymentshub-api",
		Writer:  &buf,
	})

	logger.Info("should not appear")
	logger.Warn("should appear")

	output := buf.String()
	require.NotContains(t, output, "should not appear")
	require.Contains(t, output, "should appear")
}

func TestNewLogger_DefaultsLevelToInfo(t *testing.T) {
	var buf bytes.Buffer
	logger := logging.NewLogger(logging.Options{
		Env:     "test",
		Level:   "",
		Service: "paymentshub-api",
		Writer:  &buf,
	})

	logger.Info("visible")
	require.Contains(t, buf.String(), "visible")
}
