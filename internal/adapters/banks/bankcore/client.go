package bankcore

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

// ClientConfig captures everything a REST adapter needs from this package.
type ClientConfig struct {
	BaseURL        string
	TLSConfig      *tls.Config
	HTTPTimeout    time.Duration
	MaxRetries     int
	InitialBackoff time.Duration
	BreakerName    string
	Token          *TokenSource
	// Extra request decorator; called once per request before sending.
	// Adapters use this to inject bank-specific headers (e.g. x-id-idempotente
	// for Itaú, x-correlation-id for Bradesco).
	Decorator func(*http.Request)
}

// Client is a thin, testable wrapper around http.Client with OAuth refresh,
// retry/backoff for 5xx+429 and a circuit breaker. Suitable for Brazilian
// bank APIs that uniformly favour OAuth2 + mTLS + idempotency headers.
type Client struct {
	cfg     ClientConfig
	http    *http.Client
	breaker *gobreaker.CircuitBreaker
	rng     *mrand.Rand
}

// NewClient builds the wrapper. Callers may reuse the same TokenSource for
// both transports (REST + webhook verification).
func NewClient(cfg ClientConfig) *Client {
	if cfg.HTTPTimeout == 0 {
		cfg.HTTPTimeout = 30 * time.Second
	}
	if cfg.MaxRetries == 0 {
		cfg.MaxRetries = 5
	}
	if cfg.InitialBackoff == 0 {
		cfg.InitialBackoff = 500 * time.Millisecond
	}
	if cfg.BreakerName == "" {
		cfg.BreakerName = "bankcore"
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

	breaker := gobreaker.NewCircuitBreaker(gobreaker.Settings{
		Name:        cfg.BreakerName,
		MaxRequests: 2,
		Interval:    60 * time.Second,
		Timeout:     30 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool { return counts.ConsecutiveFailures >= 5 },
	})

	return &Client{
		cfg:     cfg,
		http:    httpClient,
		breaker: breaker,
		rng:     mrand.New(mrand.NewPCG(uint64(time.Now().UnixNano()), 0xabcdef01)),
	}
}

// Do performs method+path with an optional JSON body and idempotency header.
// It handles retries and auth refresh. Caller decodes the body.
func (c *Client) Do(ctx context.Context, method, path string, body any, headers map[string]string) ([]byte, int, error) {
	var bodyBytes []byte
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, 0, fmt.Errorf("%w: marshal: %v", ErrBadResponse, err)
		}
		bodyBytes = b
	}

	result, err := c.breaker.Execute(func() (interface{}, error) {
		return c.doWithRetry(ctx, method, path, bodyBytes, headers)
	})
	if err != nil {
		if errors.Is(err, gobreaker.ErrOpenState) || errors.Is(err, gobreaker.ErrTooManyRequests) {
			return nil, 0, fmt.Errorf("%w: %v", ErrCircuit, err)
		}
		return nil, 0, err
	}
	r := result.(*rawResponse)
	return r.Body, r.Status, nil
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
			jitter := time.Duration(c.rng.Int64N(int64(backoff / 2)))
			select {
			case <-time.After(backoff + jitter):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
			backoff *= 2
		}

		var token string
		if c.cfg.Token != nil {
			t, err := c.cfg.Token.Token(ctx)
			if err != nil {
				return nil, err
			}
			token = t
		}

		var reader io.Reader
		if bodyBytes != nil {
			reader = bytes.NewReader(bodyBytes)
		}
		req, err := http.NewRequestWithContext(ctx, method, c.cfg.BaseURL+path, reader)
		if err != nil {
			return nil, fmt.Errorf("%w: build req: %v", ErrBadResponse, err)
		}
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")
		for k, v := range headers {
			req.Header.Set(k, v)
		}
		if c.cfg.Decorator != nil {
			c.cfg.Decorator(req)
		}

		resp, err := c.http.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("%w: %v", ErrUnavailable, err)
			continue
		}
		raw, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			return &rawResponse{Body: raw, Status: resp.StatusCode}, nil
		}
		if resp.StatusCode == 429 {
			lastErr = fmt.Errorf("%w: body=%s", ErrRateLimited, string(raw))
			continue
		}
		if resp.StatusCode >= 500 {
			lastErr = fmt.Errorf("%w: status=%d body=%s", ErrUnavailable, resp.StatusCode, string(raw))
			continue
		}
		return nil, fmt.Errorf("%w: status=%d body=%s", ErrRejected, resp.StatusCode, string(raw))
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("%w: exhausted retries", ErrUnavailable)
	}
	return nil, lastErr
}
