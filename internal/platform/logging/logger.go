// Package logging builds slog JSON loggers with base fields attached to every record.
//
// The redaction layer for LGPD-sensitive fields is added in Plan 10; this package
// only provides the base JSON handler here.
package logging

import (
	"io"
	"log/slog"
	"os"
	"strings"
)

// Options configures NewLogger.
type Options struct {
	Env     string
	Level   string
	Service string
	Writer  io.Writer
}

// NewLogger returns an *slog.Logger whose handler emits JSON records and always
// includes "service" and "env" attributes. Level defaults to info when blank or
// unrecognized. Writer defaults to os.Stdout when nil.
func NewLogger(opts Options) *slog.Logger {
	w := opts.Writer
	if w == nil {
		w = os.Stdout
	}

	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level: parseLevel(opts.Level),
	})

	return slog.New(handler).With(
		slog.String("service", opts.Service),
		slog.String("env", opts.Env),
	)
}

func parseLevel(raw string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
