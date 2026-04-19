package bankcore

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// TokenAuthStyle selects how client credentials are presented.
type TokenAuthStyle int

const (
	// AuthBodyParams sends client_id and client_secret in the form body.
	// Used by: Inter, Itaú, BB, BTG, Santander, Sicoob.
	AuthBodyParams TokenAuthStyle = iota
	// AuthBasicHeader sends the pair as HTTP Basic on the token request.
	// Used by: Bradesco.
	AuthBasicHeader
)

// TokenConfig describes how to obtain an OAuth2 client-credentials bearer.
type TokenConfig struct {
	TokenURL     string
	ClientID     string
	ClientSecret string
	Scope        string
	AuthStyle    TokenAuthStyle
	ExtraForm    map[string]string
}

// TokenSource lazily fetches and caches a bearer token.
type TokenSource struct {
	cfg  TokenConfig
	http *http.Client

	mu      sync.Mutex
	token   string
	expires time.Time
}

// NewTokenSource binds a source to an HTTP client (which may carry mTLS).
func NewTokenSource(httpClient *http.Client, cfg TokenConfig) *TokenSource {
	return &TokenSource{cfg: cfg, http: httpClient}
}

type tokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
	Scope       string `json:"scope"`
	Error       string `json:"error"`
	ErrorDescr  string `json:"error_description"`
}

// Token returns a fresh or cached bearer, renewing 30s before expiry.
func (ts *TokenSource) Token(ctx context.Context) (string, error) {
	ts.mu.Lock()
	defer ts.mu.Unlock()

	if ts.token != "" && time.Now().Before(ts.expires.Add(-30*time.Second)) {
		return ts.token, nil
	}

	form := url.Values{}
	form.Set("grant_type", "client_credentials")
	if ts.cfg.Scope != "" {
		form.Set("scope", ts.cfg.Scope)
	}
	for k, v := range ts.cfg.ExtraForm {
		form.Set(k, v)
	}
	if ts.cfg.AuthStyle == AuthBodyParams {
		form.Set("client_id", ts.cfg.ClientID)
		form.Set("client_secret", ts.cfg.ClientSecret)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ts.cfg.TokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", fmt.Errorf("%w: build req: %v", ErrAuth, err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	if ts.cfg.AuthStyle == AuthBasicHeader {
		req.SetBasicAuth(ts.cfg.ClientID, ts.cfg.ClientSecret)
	}

	resp, err := ts.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrAuth, err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%w: status=%d body=%s", ErrAuth, resp.StatusCode, string(raw))
	}

	var tr tokenResponse
	if err := json.Unmarshal(raw, &tr); err != nil {
		return "", fmt.Errorf("%w: parse: %v", ErrAuth, err)
	}
	if tr.AccessToken == "" {
		return "", fmt.Errorf("%w: empty access_token (%s)", ErrAuth, tr.Error)
	}
	ts.token = tr.AccessToken
	if tr.ExpiresIn <= 0 {
		ts.expires = time.Now().Add(15 * time.Minute)
	} else {
		ts.expires = time.Now().Add(time.Duration(tr.ExpiresIn) * time.Second)
	}
	return ts.token, nil
}
