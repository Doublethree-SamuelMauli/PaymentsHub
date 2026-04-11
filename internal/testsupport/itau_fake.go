package testsupport

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

// FakeItauServer is a httptest-based Itaú REST sandbox suitable for unit and
// integration tests of the rest adapter and the workers that depend on it.
type FakeItauServer struct {
	Server      *httptest.Server
	mu          sync.Mutex
	SeenReqs    []FakeItauRequest
	OverrideFn  map[string]http.HandlerFunc // key "METHOD PATH"
	ValidTokens map[string]bool
}

// FakeItauRequest captures one call for assertions.
type FakeItauRequest struct {
	Method string
	Path   string
	Body   string
	Header http.Header
}

// NewFakeItau starts a fake Itaú REST server and returns it.
func NewFakeItau(t *testing.T) *FakeItauServer {
	t.Helper()
	fake := &FakeItauServer{
		OverrideFn:  map[string]http.HandlerFunc{},
		ValidTokens: map[string]bool{},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/oauth/token", fake.handleToken)
	mux.HandleFunc("/cash-management/v2/pix/", fake.handlePix)
	mux.HandleFunc("/cash-management/v2/pix", fake.handlePix)
	mux.HandleFunc("/cash-management/v2/dict/keys/", fake.handleDict)

	fake.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fake.record(r)
		key := r.Method + " " + r.URL.Path
		if fn, ok := fake.OverrideFn[key]; ok {
			fn(w, r)
			return
		}
		mux.ServeHTTP(w, r)
	}))

	t.Cleanup(fake.Server.Close)
	return fake
}

// URL returns the fake server root URL.
func (f *FakeItauServer) URL() string { return f.Server.URL }

// Requests returns a snapshot of all captured requests.
func (f *FakeItauServer) Requests() []FakeItauRequest {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := make([]FakeItauRequest, len(f.SeenReqs))
	copy(out, f.SeenReqs)
	return out
}

func (f *FakeItauServer) record(r *http.Request) {
	f.mu.Lock()
	defer f.mu.Unlock()

	// httptest already reads body into request.Body. We only capture method/path/headers
	// since body re-read is not safe here (server will still consume it downstream via mux).
	f.SeenReqs = append(f.SeenReqs, FakeItauRequest{
		Method: r.Method,
		Path:   r.URL.Path,
		Header: r.Header.Clone(),
	})
}

func (f *FakeItauServer) handleToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	token := "fake-token-123"
	f.mu.Lock()
	f.ValidTokens[token] = true
	f.mu.Unlock()
	_ = json.NewEncoder(w).Encode(map[string]any{
		"access_token": token,
		"token_type":   "bearer",
		"expires_in":   3600,
	})
}

func (f *FakeItauServer) handlePix(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		idem := r.Header.Get("x-id-idempotente")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"codigoSolicitacao": "cod-" + idem,
			"status":            "APROVADO",
			"endToEndId":        "E12345678" + idem,
		})
	case http.MethodGet:
		parts := strings.Split(r.URL.Path, "/")
		id := parts[len(parts)-1]
		_ = json.NewEncoder(w).Encode(map[string]any{
			"codigoSolicitacao": id,
			"status":            "FINALIZADO",
			"endToEndId":        "E00000001" + id,
			"dataLiquidacao":    "2026-04-11T12:00:00Z",
		})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (f *FakeItauServer) handleDict(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	key := parts[len(parts)-1]
	_ = json.NewEncoder(w).Encode(map[string]any{
		"chave":     key,
		"tipoChave": "CNPJ",
		"titular":   "ACME Fornecedor LTDA",
		"documento": "12345678000199",
		"status":    "ATIVO",
	})
}
