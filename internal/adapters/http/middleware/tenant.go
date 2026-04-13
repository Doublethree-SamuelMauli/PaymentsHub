package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

type tenantKeyT int

const tenantKey tenantKeyT = 0

// TenantFromContext returns the client_id of the authenticated tenant.
// Returns uuid.Nil if no tenant is set (e.g., admin or unauthenticated routes).
func TenantFromContext(ctx context.Context) uuid.UUID {
	v, _ := ctx.Value(tenantKey).(uuid.UUID)
	return v
}

// WithTenant returns a new context carrying the given tenant id.
func WithTenant(ctx context.Context, clientID uuid.UUID) context.Context {
	return context.WithValue(ctx, tenantKey, clientID)
}

// RequireTenant rejects requests without a tenant in context (403).
// Should be placed after APIKeyAuth, which resolves the key's client_id.
func RequireTenant(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if TenantFromContext(r.Context()) == uuid.Nil {
			writeError(w, http.StatusForbidden, "tenant_required")
			return
		}
		next.ServeHTTP(w, r)
	})
}
