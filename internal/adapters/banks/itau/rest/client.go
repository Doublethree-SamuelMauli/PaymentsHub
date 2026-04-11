package rest

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	mrand "math/rand/v2"
	"net/http"
	"time"

	"github.com/sony/gobreaker"
)

// Config describes how to build a Client.
type Config struct {
	BaseURL        string
	TokenURL       string
	OAuthClientID  string
	OAuthSecret    string
	Scope          string
	TLSConfig      *tls.Config // mTLS; nil is allowed in dev/test
	HTTPTimeout    time.Duration
	MaxRetries     int
	InitialBackoff time.Duration
	BreakerName    string
}

// Client wraps an HTTP client with mTLS, retry/backoff, and a per-account
// circuit breaker. All Itaú REST calls go through doRequest.
type Client struct {
	cfg        Config
	http       *http.Client
	tokens     *TokenSource
	breaker    *gobreaker.CircuitBreaker
	backoffRng *mrand.Rand
}

// NewClient builds a client from the given config. In tests the caller passes
// a Config whose BaseURL/TokenURL point at an httptest server.
func NewClient(cfg Config) *Client {
	if cfg.HTTPTimeout == 0 {
		cfg.HTTPTimeout = 30 * time.Second
	}
	if cfg.MaxRetries == 0 {
		cfg.MaxRetries = 5
	}
	if cfg.InitialBackoff == 0 {
		cfg.InitialBackoff = 1 * time.Second
	}

	transport := &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 20,
		IdleConnTimeout:     90 * time.Second,
	}
	if cfg.TLSConfig != nil {
		transport.TLSClientConfig = cfg.TLSConfig
	}

	httpClient := &http.Client{Transport: transport, Timeout: cfg.HTTPTimeout}
	tokens := NewTokenSource(httpClient, cfg.TokenURL, cfg.OAuthClientID, cfg.OAuthSecret, cfg.Scope)

	name := cfg.BreakerName
	if name == "" {
		name = "itau-rest"
	}
	breaker := gobreaker.NewCircuitBreaker(gobreaker.Settings{
		Name:        name,
		MaxRequests: 2,
		Interval:    60 * time.Second,
		Timeout:     30 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			return counts.ConsecutiveFailures >= 5
		},
	})

	return &Client{
		cfg:        cfg,
		http:       httpClient,
		tokens:     tokens,
		breaker:    breaker,
		backoffRng: mrand.New(mrand.NewPCG(uint64(time.Now().UnixNano()), 0xdeadbeef)),
	}
}

// doRequest performs method+path with optional body, adding Authorization and
// common retry logic. Caller decodes the successful response body itself.
func (c *Client) doRequest(ctx context.Context, method, path string, body any, headers map[string]string) ([]byte, int, error) {
	var bodyBytes []byte
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, 0, fmt.Errorf("marshal body: %w", err)
		}
		bodyBytes = b
	}

	result, err := c.breaker.Execute(func() (interface{}, error) {
		return c.doWithRetry(ctx, method, path, bodyBytes, headers)
	})
	if err != nil {
		if errors.Is(err, gobreaker.ErrOpenState) || errors.Is(err, gobreaker.ErrTooManyRequests) {
			return nil, 0, fmt.Errorf("%w: %v", ErrCircuitOpen, err)
		}
		return nil, 0, err
	}
	out := result.(*rawResponse)
	return out.Body, out.Status, nil
}

type rawResponse struct {
	Body   []byte
	Status int
}

func (c *Client) doWithRetry(ctx context.Context, method, path string, bodyBytes []byte, headers map[string]string) (*rawResponse, error) {
	var lastErr error
	backoff := c.cfg.InitialBackoff
	for attempt := 0; attempt < c.cfg.MaxRetries; attempt++ {
		if attempt > 0 {
			jitter := time.Duration(c.backoffRng.Int64N(int64(backoff / 2)))
			select {
			case <-time.After(backoff + jitter):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
			backoff *= 2
		}

		token, err := c.tokens.Token(ctx)
		if err != nil {
			return nil, err
		}

		var reader io.Reader
		if bodyBytes != nil {
			reader = bytes.NewReader(bodyBytes)
		}
		req, err := http.NewRequestWithContext(ctx, method, c.cfg.BaseURL+path, reader)
		if err != nil {
			return nil, fmt.Errorf("build req: %w", err)
		}
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		for k, v := range headers {
			req.Header.Set(k, v)
		}

		resp, err := c.http.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("%w: %v", ErrBankUnavailable, err)
			continue // retry
		}
		b, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		// Success
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			return &rawResponse{Body: b, Status: resp.StatusCode}, nil
		}
		// Retryable
		if resp.StatusCode == 429 || resp.StatusCode >= 500 {
			if resp.StatusCode == 429 {
				lastErr = fmt.Errorf("%w: status=429 body=%s", ErrRateLimited, string(b))
			} else {
				lastErr = fmt.Errorf("%w: status=%d body=%s", ErrBankUnavailable, resp.StatusCode, string(b))
			}
			continue
		}
		// Non-retryable 4xx
		return nil, fmt.Errorf("%w: status=%d body=%s", ErrRejectedByBank, resp.StatusCode, string(b))
	}

	if lastErr == nil {
		lastErr = ErrUnexpectedStatus
	}
	return nil, lastErr
}
