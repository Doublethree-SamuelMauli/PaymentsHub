package rest

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

// TokenSource yields OAuth2 bearer tokens, caching them until 30s before
// expiration. Not goroutine-specific — one instance per payer account.
type TokenSource struct {
	httpClient *http.Client
	tokenURL   string
	clientID   string
	secret     string
	scope      string

	mu      sync.Mutex
	token   string
	expires time.Time
}

// NewTokenSource builds a token source bound to an HTTP client (which can be
// mTLS-configured or a plain httptest client in tests).
func NewTokenSource(httpClient *http.Client, tokenURL, clientID, secret, scope string) *TokenSource {
	return &TokenSource{
		httpClient: httpClient,
		tokenURL:   tokenURL,
		clientID:   clientID,
		secret:     secret,
		scope:      scope,
	}
}

type tokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

// Token returns the current access token, refreshing if necessary.
func (ts *TokenSource) Token(ctx context.Context) (string, error) {
	ts.mu.Lock()
	defer ts.mu.Unlock()

	if ts.token != "" && time.Now().Before(ts.expires.Add(-30*time.Second)) {
		return ts.token, nil
	}

	form := url.Values{}
	form.Set("grant_type", "client_credentials")
	form.Set("client_id", ts.clientID)
	form.Set("client_secret", ts.secret)
	if ts.scope != "" {
		form.Set("scope", ts.scope)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ts.tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", fmt.Errorf("%w: build req: %v", ErrAuthFailed, err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := ts.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("%w: do: %v", ErrAuthFailed, err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%w: status=%d body=%s", ErrAuthFailed, resp.StatusCode, string(body))
	}

	var tr tokenResponse
	if err := json.Unmarshal(body, &tr); err != nil {
		return "", fmt.Errorf("%w: parse: %v", ErrAuthFailed, err)
	}
	if tr.AccessToken == "" {
		return "", fmt.Errorf("%w: empty access_token", ErrAuthFailed)
	}

	ts.token = tr.AccessToken
	if tr.ExpiresIn <= 0 {
		ts.expires = time.Now().Add(15 * time.Minute) // conservative default
	} else {
		ts.expires = time.Now().Add(time.Duration(tr.ExpiresIn) * time.Second)
	}
	return ts.token, nil
}
