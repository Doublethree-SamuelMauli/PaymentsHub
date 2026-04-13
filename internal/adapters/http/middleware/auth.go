// Package middleware holds the PaymentsHub HTTP middlewares.
package middleware

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
)

type ctxKeyT int

const (
	ctxKeyAPIKeyID ctxKeyT = iota
	ctxKeyAPIKeyScopes
	ctxKeyAPIKeyLabel
)

// APIKeyLookup is the minimal repository surface the middleware needs.
type APIKeyLookup interface {
	GetByHash(ctx context.Context, hash string) (*ports.APIKey, error)
	Touch(ctx context.Context, id uuid.UUID) error
}

// APIKeyAuth returns a middleware that authenticates each request using a
// Bearer token. The token is sha256-hashed and looked up in the key store.
// On success the key id, label, and scopes are attached to the request context.
func APIKeyAuth(keys APIKeyLookup) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, ok := bearerToken(r)
			if !ok {
				writeError(w, http.StatusUnauthorized, "missing_or_malformed_authorization")
				return
			}
			hash := HashToken(token)

			key, err := keys.GetByHash(r.Context(), hash)
			if err != nil {
				if errors.Is(err, domain.ErrNotFound) {
					writeError(w, http.StatusUnauthorized, "invalid_api_key")
					return
				}
				writeError(w, http.StatusInternalServerError, "auth_lookup_failed")
				return
			}

			// Best-effort touch; do not block on error.
			_ = keys.Touch(r.Context(), key.ID)

			ctx := context.WithValue(r.Context(), ctxKeyAPIKeyID, key.ID)
			ctx = context.WithValue(ctx, ctxKeyAPIKeyScopes, key.Scopes)
			ctx = context.WithValue(ctx, ctxKeyAPIKeyLabel, key.Label)
			if key.ClientID != nil {
				ctx = WithTenant(ctx, *key.ClientID)
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireScope returns a middleware that rejects with 403 if the authenticated
// API key does not have the given scope.
func RequireScope(scope string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			scopes, _ := r.Context().Value(ctxKeyAPIKeyScopes).([]string)
			if !hasScope(scopes, scope) {
				writeError(w, http.StatusForbidden, "missing_scope:"+scope)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// APIKeyIDFromContext returns the authenticated key id, or uuid.Nil if unauth.
func APIKeyIDFromContext(ctx context.Context) uuid.UUID {
	v, ok := ctx.Value(ctxKeyAPIKeyID).(uuid.UUID)
	if !ok {
		return uuid.Nil
	}
	return v
}

// APIKeyLabelFromContext returns the authenticated key label.
func APIKeyLabelFromContext(ctx context.Context) string {
	v, _ := ctx.Value(ctxKeyAPIKeyLabel).(string)
	return v
}

// HashToken returns sha256 hex of the raw token.
func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func bearerToken(r *http.Request) (string, bool) {
	h := r.Header.Get("Authorization")
	if h == "" {
		return "", false
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(h, prefix) {
		return "", false
	}
	t := strings.TrimSpace(h[len(prefix):])
	if t == "" {
		return "", false
	}
	return t, true
}

func hasScope(scopes []string, want string) bool {
	for _, s := range scopes {
		if s == want || s == "admin" {
			return true
		}
	}
	return false
}

func writeError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_, _ = w.Write([]byte(`{"error":"` + msg + `"}`))
}
