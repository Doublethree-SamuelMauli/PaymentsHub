package logging

import (
	"context"
	"log/slog"
	"regexp"
	"strings"
)

var (
	cpfPattern  = regexp.MustCompile(`\b(\d{3})\d{3}\d{3}(\d{2})\b`)
	cnpjPattern = regexp.MustCompile(`\b(\d{2})\d{3}\d{3}\d{4}(\d{2})\b`)
)

// RedactingHandler wraps a slog.Handler and masks CPF/CNPJ values in string
// attributes (first 3 + last 2 visible for CPF, first 2 + last 2 for CNPJ).
// This provides LGPD compliance in structured logs without losing debuggability.
type RedactingHandler struct {
	inner slog.Handler
}

// NewRedactingHandler wraps an existing handler.
func NewRedactingHandler(inner slog.Handler) *RedactingHandler {
	return &RedactingHandler{inner: inner}
}

func (h *RedactingHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.inner.Enabled(ctx, level)
}

func (h *RedactingHandler) Handle(ctx context.Context, r slog.Record) error {
	var newAttrs []slog.Attr
	r.Attrs(func(a slog.Attr) bool {
		newAttrs = append(newAttrs, redactAttr(a))
		return true
	})
	newRecord := slog.NewRecord(r.Time, r.Level, r.Message, r.PC)
	newRecord.AddAttrs(newAttrs...)
	return h.inner.Handle(ctx, newRecord)
}

func (h *RedactingHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	redacted := make([]slog.Attr, len(attrs))
	for i, a := range attrs {
		redacted[i] = redactAttr(a)
	}
	return &RedactingHandler{inner: h.inner.WithAttrs(redacted)}
}

func (h *RedactingHandler) WithGroup(name string) slog.Handler {
	return &RedactingHandler{inner: h.inner.WithGroup(name)}
}

func redactAttr(a slog.Attr) slog.Attr {
	if a.Value.Kind() == slog.KindString {
		a.Value = slog.StringValue(redactString(a.Value.String()))
	}
	return a
}

func redactString(s string) string {
	s = cpfPattern.ReplaceAllString(s, "${1}***${2}")
	s = cnpjPattern.ReplaceAllString(s, "${1}***${2}")
	return s
}

// RedactCPF masks a CPF showing only first 3 and last 2 digits.
func RedactCPF(cpf string) string {
	clean := strings.ReplaceAll(cpf, ".", "")
	clean = strings.ReplaceAll(clean, "-", "")
	if len(clean) == 11 {
		return clean[:3] + "***" + clean[9:]
	}
	return "***"
}

// RedactCNPJ masks a CNPJ showing only first 2 and last 2 digits.
func RedactCNPJ(cnpj string) string {
	clean := strings.ReplaceAll(cnpj, ".", "")
	clean = strings.ReplaceAll(clean, "/", "")
	clean = strings.ReplaceAll(clean, "-", "")
	if len(clean) == 14 {
		return clean[:2] + "***" + clean[12:]
	}
	return "***"
}
