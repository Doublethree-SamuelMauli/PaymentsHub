package middleware_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
)

type stubKeyStore struct {
	byHash map[string]*ports.APIKey
}

func (s *stubKeyStore) GetByHash(_ context.Context, hash string) (*ports.APIKey, error) {
	k, ok := s.byHash[hash]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return k, nil
}

func (s *stubKeyStore) Touch(_ context.Context, _ uuid.UUID) error { return nil }

func TestAPIKeyAuth_ValidTokenAttachesCtx(t *testing.T) {
	token := "secret-token-xyz"
	hash := middleware.HashToken(token)
	keyID := uuid.New()

	store := &stubKeyStore{byHash: map[string]*ports.APIKey{
		hash: {ID: keyID, Label: "test", KeyHash: hash, Scopes: []string{"payments:write"}, Active: true},
	}}

	var capturedID uuid.UUID
	handler := middleware.APIKeyAuth(store)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedID = middleware.APIKeyIDFromContext(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/v1/payments", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)
	require.Equal(t, keyID, capturedID)
}

func TestAPIKeyAuth_MissingHeaderRejects(t *testing.T) {
	store := &stubKeyStore{byHash: map[string]*ports.APIKey{}}
	handler := middleware.APIKeyAuth(store)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		t.Fatal("should not reach")
	}))
	req := httptest.NewRequest(http.MethodPost, "/v1/payments", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusUnauthorized, rec.Code)
	b, _ := io.ReadAll(rec.Body)
	require.Contains(t, string(b), "missing_or_malformed_authorization")
}

func TestAPIKeyAuth_UnknownTokenRejects(t *testing.T) {
	store := &stubKeyStore{byHash: map[string]*ports.APIKey{}}
	handler := middleware.APIKeyAuth(store)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {}))
	req := httptest.NewRequest(http.MethodPost, "/v1/payments", nil)
	req.Header.Set("Authorization", "Bearer does-not-exist")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	require.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestRequireScope_AdminBypasses(t *testing.T) {
	store := &stubKeyStore{byHash: map[string]*ports.APIKey{}}
	token := "admin-token"
	hash := middleware.HashToken(token)
	store.byHash[hash] = &ports.APIKey{
		ID: uuid.New(), KeyHash: hash, Scopes: []string{"admin"}, Active: true,
	}

	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
	h := middleware.APIKeyAuth(store)(middleware.RequireScope("runs:approve")(next))

	req := httptest.NewRequest(http.MethodPost, "/x", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	require.Equal(t, http.StatusOK, rec.Code)
}

func TestRequireScope_MissingScopeRejects(t *testing.T) {
	store := &stubKeyStore{byHash: map[string]*ports.APIKey{}}
	token := "limited-token"
	hash := middleware.HashToken(token)
	store.byHash[hash] = &ports.APIKey{
		ID: uuid.New(), KeyHash: hash, Scopes: []string{"payments:read"}, Active: true,
	}

	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { t.Fatal("should not reach") })
	h := middleware.APIKeyAuth(store)(middleware.RequireScope("payments:write")(next))
	req := httptest.NewRequest(http.MethodPost, "/x", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	require.Equal(t, http.StatusForbidden, rec.Code)
}
