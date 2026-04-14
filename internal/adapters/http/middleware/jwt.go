package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type jwtKeyT int

const jwtKey jwtKeyT = 100

// JWTAuth validates a Bearer JWT and injects claims into the context.
// Used for portal endpoints that authenticate users (not API keys).
func JWTAuth(secret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := r.Header.Get("Authorization")
			if !strings.HasPrefix(h, "Bearer ") {
				writeError(w, http.StatusUnauthorized, "missing token")
				return
			}
			raw := strings.TrimPrefix(h, "Bearer ")
			token, err := jwt.Parse(raw, func(t *jwt.Token) (any, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return secret, nil
			})
			if err != nil || !token.Valid {
				writeError(w, http.StatusUnauthorized, "invalid token")
				return
			}
			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				writeError(w, http.StatusUnauthorized, "invalid claims")
				return
			}
			ctx := context.WithValue(r.Context(), jwtKey, claims)
			// Inject tenant for repository isolation
			if cid, ok := claims["client_id"].(string); ok && cid != "" {
				if parsed, err := uuid.Parse(cid); err == nil {
					ctx = WithTenant(ctx, parsed)
				}
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// JWTClaimsFromContext returns the JWT claims, or nil if unauthenticated.
func JWTClaimsFromContext(ctx context.Context) jwt.MapClaims {
	v, _ := ctx.Value(jwtKey).(jwt.MapClaims)
	return v
}

// RequireRole checks that the authenticated user has at least the given role.
// Role hierarchy: admin > approver > operator > viewer.
// Works with BOTH JWT (users) and API key (machine). API key with "admin" scope passes any role check.
func RequireRole(requiredRole string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// API key path: admin scope = bypass
			scopes, _ := r.Context().Value(ctxKeyAPIKeyScopes).([]string)
			for _, s := range scopes {
				if s == "admin" {
					next.ServeHTTP(w, r)
					return
				}
			}
			// JWT path: check role claim
			claims := JWTClaimsFromContext(r.Context())
			if claims == nil {
				writeError(w, http.StatusUnauthorized, "authentication required")
				return
			}
			role, _ := claims["role"].(string)
			if !roleCovers(role, requiredRole) {
				writeError(w, http.StatusForbidden, "insufficient role: need "+requiredRole)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// roleCovers returns true if `have` >= `need` in the hierarchy.
func roleCovers(have, need string) bool {
	levels := map[string]int{"viewer": 1, "operator": 2, "approver": 3, "admin": 4}
	return levels[have] >= levels[need] && levels[need] > 0
}

// RoleFromContext returns the role of the authenticated user (JWT) or empty.
func RoleFromContext(ctx context.Context) string {
	claims := JWTClaimsFromContext(ctx)
	if claims == nil {
		return ""
	}
	r, _ := claims["role"].(string)
	return r
}
