# PaymentsHub Fase 1 — Plano 02: Domain & Persistence

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Land the full PaymentsHub schema (all tables from spec §3.1) with the audit-log immutability trigger, wire sqlc queries for every entity, implement pure-Go domain types with state machines for `Payment`, `PaymentRun`, and `CnabFile`, and provide repository adapters that translate between sqlc rows and domain types. All unit tests for state machines green; all repository integration tests green against testcontainers Postgres.

**Architecture:** Domain is pure Go (no `database/sql`, no `pgx`). Repositories live in `internal/adapters/db/repositories` and use sqlc-generated code. Application use cases (Plan 03+) depend on repository *interfaces* declared in `internal/app/ports`.

**Tech stack delta from Plan 01:** `jackc/pgx/v5/pgxpool`, `google/uuid`, existing `sqlc` wiring.

---

## Scope

**Delivered:**
- 10 new migrations (tables + indexes + triggers)
- sqlc queries for all tables
- Domain layer: `money`, `payment`, `run`, `cnab`, `beneficiary` packages
- State machines enforced by pure Go with table-driven transition validation
- Repository implementations for every entity
- Integration tests (via testcontainers) for representative repositories
- Unit tests for every state machine
- `/readyz` now includes a real Postgres `SELECT 1` check

**Not delivered (later plans):** HTTP handlers, use cases/application services, Itaú clients, CNAB codec, workers, security hardening, observability.

---

## File plan

### New migrations (`db/migrations/`)
- `00002_bank_certificates.sql`
- `00003_payer_accounts.sql`
- `00004_beneficiaries.sql`
- `00005_payments.sql`
- `00006_payment_events.sql` (includes immutability trigger)
- `00007_payment_runs.sql`
- `00008_cnab_files.sql`
- `00009_prevalidation_results.sql`
- `00010_idempotency_keys.sql`
- `00011_api_keys.sql`

### New sqlc queries (`queries/`)
- `bank_certificates.sql`
- `payer_accounts.sql`
- `beneficiaries.sql`
- `payments.sql`
- `payment_events.sql`
- `payment_runs.sql`
- `cnab_files.sql`
- `prevalidation_results.sql`
- `idempotency_keys.sql`
- `api_keys.sql`
- Delete `queries/dummy.sql`

### New domain (`internal/domain/`)
- `money/money.go` + `money_test.go` — `Cents int64` with `Add`, `Sub`, `FormatBRL`
- `payment/payment.go` — `Payment` struct + constructors
- `payment/status.go` — `Status` enum, transition table, `Transition(from, to, actor, reason)` pure func
- `payment/status_test.go` — covers every legal/illegal transition
- `payment/type.go` — `Type` enum `PIX|TED`
- `payment/event.go` — `Event` struct (audit log row)
- `run/run.go` + `run/status.go` + tests
- `cnab/file.go` + `cnab/status.go`
- `beneficiary/beneficiary.go` (no state machine; plain entity)
- `errors.go` — `ErrIllegalTransition`, `ErrNotFound`, `ErrConflict`, `ErrAlreadyTerminal`

### New app ports (`internal/app/ports/`)
- `repositories.go` — interfaces: `PaymentRepository`, `PaymentRunRepository`, `BeneficiaryRepository`, `PayerAccountRepository`, `CnabFileRepository`, `BankCertificateRepository`, `PrevalidationRepository`, `IdempotencyRepository`, `ApiKeyRepository`

### New repositories (`internal/adapters/db/`)
- `pool.go` — `NewPool(ctx, dsn)` → `*pgxpool.Pool` + `Ping`
- `repositories/payment.go`
- `repositories/run.go`
- `repositories/beneficiary.go`
- `repositories/payer_account.go`
- `repositories/cnab_file.go`
- `repositories/bank_certificate.go`
- `repositories/prevalidation.go`
- `repositories/idempotency.go`
- `repositories/api_key.go`
- Each has a matching `*_test.go` integration test

### Modified files
- `internal/adapters/http/router.go` — accept a DB readiness check via deps (already supported, we just wire it)
- `cmd/api/main.go` — open pgxpool, pass readiness check, close pool on shutdown
- `internal/testsupport/postgres.go` — add `OpenPool(t)` helper returning `*pgxpool.Pool`

---

## Task groups (execution order)

Executed as one big TDD loop per group. Commit after each group.

### Group A — Migrations
Write all 10 migration files, apply them with goose locally, validate via `\d` in psql. One commit.

### Group B — sqlc queries + generation
Write the `.sql` query files, remove `dummy.sql`, run `make sqlc`, commit generated code together with the queries.

### Group C — Domain layer
Write `money`, `payment`, `run`, `cnab`, `beneficiary`, `errors` packages. TDD the state machines (`payment/status_test.go` is the centerpiece — a table of `{from, to, shouldAllow}` cases). Commit.

### Group D — pgxpool wiring
Create `internal/adapters/db/pool.go`, update `cmd/api/main.go` to open the pool and register a readiness check, close on shutdown. Update integration test `TestIntegration_Readyz_WithDB`. Commit.

### Group E — Repositories
One repository at a time, each with a repository integration test using `testsupport.SpawnPostgres`. Payment repo is the anchor (most complex). Commit after each repo.

### Group F — Gate
`make lint`, `make unit`, `make integration`. Fix anything red. Commit stabilization.

---

## Acceptance criteria

1. `make migrate-up` applies 11 migrations cleanly from a fresh DB.
2. Attempted `UPDATE payment_events` / `DELETE FROM payment_events` in psql raises `payment_events is append-only`.
3. `make sqlc` regenerates without diffs when run twice.
4. `make unit` covers every legal and illegal transition for `payment.Transition`, `run.Transition`, `cnab.Transition`.
5. `make integration` adds at least `TestPaymentRepo_CreateLoadList`, `TestRunRepo_CreateApprove`, `TestIdempotencyRepo_InsertLookup`.
6. `/readyz` returns 503 if the pool cannot `Ping`, 200 otherwise — verified via a dedicated integration test.
7. One git commit per group (A–F), each passing its tests.
