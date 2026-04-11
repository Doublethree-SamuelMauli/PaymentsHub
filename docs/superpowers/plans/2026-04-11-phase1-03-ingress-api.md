# PaymentsHub Fase 1 — Plano 03: Ingress API (MVP)

**Goal:** Deliver the ingress pipeline: API-key authentication middleware, request-id propagation, the `ReceivePayment` application use case with idempotency enforcement + audit-event emission, and HTTP handlers for `POST /v1/payments` and `GET /v1/payments/:id`. Bulk and CSV/Excel import handlers are deferred to a follow-up increment — they are variations on the same `ReceivePayment` pipeline and bringing the single path in first unblocks Plans 04–10.

**Architecture:** Authentication is a chi middleware that hashes the Bearer token, looks it up via `APIKeyRepository.GetByHash`, and writes the resolved key + scopes into the request context. `ReceivePayment` is a pure application service in `internal/app` that orchestrates `PaymentRepository.Insert`, `PaymentEventRepository.Insert`, and `IdempotencyRepository.Insert/Get` inside a single pgx transaction. DTO validation is done via `go-playground/validator/v10` on struct tags. The handler is thin: parse, validate, call use case, render.

## Scope

**Delivered**
- `internal/adapters/http/middleware/auth.go` + tests
- `internal/adapters/http/middleware/request_id.go` (wrapping chi's middleware with slog key)
- `internal/app/receive_payment.go` + tests (integration)
- `internal/adapters/http/dto/payment.go` (request/response structs with validator tags)
- `internal/adapters/http/handlers/payments.go` (`Create`, `Get`)
- Router wiring in `router.go` for `POST /v1/payments`, `GET /v1/payments/:id`
- `cmd/api/main.go` constructs repositories, use case, and hands them to the router
- Integration test: full ingress happy-path + idempotent replay + invalid auth + invalid body

**Deferred to later** (these are incremental): bulk endpoint, CSV import, Excel import, pagination listing, under-review rule engine, rate limit (Plan 10).

## Acceptance criteria
1. `POST /v1/payments` with a valid API key + Idempotency-Key returns 201 and persists the payment in `RECEIVED` with a row in `payment_events`.
2. Replaying the same `Idempotency-Key` with the same body returns 200 and the original response (from cache).
3. Replaying the same `Idempotency-Key` with a different body returns 409.
4. Invalid Bearer token returns 401; missing scope returns 403.
5. Malformed JSON or schema violation returns 400 with structured error body.
6. `GET /v1/payments/:id` returns the payment + timeline of events.
7. `make test` stays green.
