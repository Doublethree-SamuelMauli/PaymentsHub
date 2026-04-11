# PaymentsHub Fase 1 — Plano 05: Itaú REST Adapter

**Goal:** Land the Itaú REST client that Plans 08/09 will invoke: OAuth2 client_credentials with in-memory token cache, mTLS-capable HTTP transport (so production certs plug in transparently), DICT PIX key lookup for pre-validation, PIX send/get/cancel, retry with exponential backoff + jitter, circuit breaker per payer account, and a `PaymentGateway` interface the worker layer depends on. All driven against an `httptest.Server` simulating Itaú sandbox responses — no real sandbox traffic in this plan.

**Architecture:** New package `internal/adapters/banks/itau/rest/` contains `auth.go`, `client.go`, `dict.go`, `pix.go`, `errors.go`, plus tests. The public surface is an interface in `internal/app/ports/gateway.go` — `PaymentGateway` — so the application layer never imports `itau/*` directly. A `FakeItauServer` fixture lives in `internal/testsupport/itau_fake.go` to be reused by worker tests in Plan 08.

**Deferred:** Real sandbox smoke (needs credentials + certificate); JWS signing for Open Finance scopes (arrives with production hardening in Plan 10); multiple simultaneous tokens per payer account (we support one per-account token cache entry for Phase 1).

## Files
- `internal/app/ports/gateway.go`
- `internal/adapters/banks/itau/rest/errors.go`
- `internal/adapters/banks/itau/rest/auth.go` + `auth_test.go`
- `internal/adapters/banks/itau/rest/client.go` + `client_test.go`
- `internal/adapters/banks/itau/rest/dict.go` + `dict_test.go`
- `internal/adapters/banks/itau/rest/pix.go` + `pix_test.go`
- `internal/adapters/banks/itau/rest/gateway.go` (implements `PaymentGateway`)
- `internal/testsupport/itau_fake.go`

## Acceptance
1. OAuth token cached and refreshed before expiration.
2. Circuit breaker trips after N consecutive failures and half-opens after cooldown.
3. Retry honors 429/5xx, skips 4xx other than 429.
4. DICT lookup parses happy-path and rejects malformed keys.
5. Send PIX happy-path returns end-to-end id + status; sandbox error mapped to typed errors.
6. `PaymentGateway` interface complete so Plan 08 can depend on it today.
