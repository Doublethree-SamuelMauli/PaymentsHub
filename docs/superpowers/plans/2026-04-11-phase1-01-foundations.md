# PaymentsHub Fase 1 — Plano 01: Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the PaymentsHub Go project end-to-end: module, directory layout per hexagonal architecture, Docker Compose with Postgres + MinIO, goose migrations infrastructure, sqlc wired, slog JSON logging, envconfig-based configuration, chi HTTP server with `/healthz` and `/readyz`, worker binary stub, Dockerfile multi-stage distroless, golangci-lint strict preset, Makefile, testcontainers-go integration test helper, and a first green end-to-end check: `make test` passes running an integration test that starts `cmd/api` against a real Postgres container and asserts `GET /healthz == 200`.

**Architecture:** Ports & Adapters (hexagonal). Two binaries (`cmd/api`, `cmd/worker`) sharing `internal/` packages. Config and logging are foundation packages used by everything else. Database access is introduced in Plan 02; this plan only provisions the goose migrations runner, an empty `db/migrations/` directory with one bootstrap migration (`schema_metadata`), and the sqlc config file wired to an empty queries directory. No domain code yet.

**Tech Stack:** Go 1.22, chi, pgx/v5, goose, sqlc, slog, envconfig, Docker, docker-compose, Postgres 16, MinIO, testcontainers-go, testify, golangci-lint.

---

## Scope

**What this plan delivers:**
- `PaymentsHub/` becomes a working Go module with the full directory skeleton
- `docker-compose up` brings up Postgres + MinIO + otel-collector locally
- `make migrate-up` runs goose migrations
- `make lint` runs golangci-lint clean
- `make test` runs a unit test and an integration test (both green)
- `make run-api` starts the HTTP server and `curl localhost:8080/healthz` returns `200 OK`
- `make run-worker` starts the worker binary (empty job registry — just logs startup)
- `docker build` produces a distroless image for both binaries
- `git` initialized, first commit(s) made

**What this plan does NOT deliver (later plans):**
- Any domain entity, state machine, or sqlc query (Plan 02)
- Any ingress endpoint beyond health checks (Plan 03)
- Authentication middleware (Plan 03)
- Itaú adapter, CNAB codec, SFTP, workers, webhooks, security hardening (Plans 05+)

---

## File Structure (introduced by this plan)

```
PaymentsHub/
├── .gitignore                           CREATE
├── .dockerignore                        CREATE
├── .golangci.yml                        CREATE
├── Makefile                             CREATE
├── README.md                            CREATE
├── go.mod                               CREATE (go mod init)
├── go.sum                               CREATE (automatic)
├── sqlc.yaml                            CREATE
├── docker-compose.yml                   CREATE
├── Dockerfile.api                       CREATE
├── Dockerfile.worker                    CREATE
├── cmd/
│   ├── api/
│   │   └── main.go                      CREATE
│   └── worker/
│       └── main.go                      CREATE
├── internal/
│   ├── platform/
│   │   ├── config/
│   │   │   ├── config.go                CREATE
│   │   │   └── config_test.go           CREATE
│   │   └── logging/
│   │       ├── logger.go                CREATE
│   │       └── logger_test.go           CREATE
│   └── adapters/
│       └── http/
│           ├── router.go                CREATE
│           ├── health.go                CREATE
│           └── health_test.go           CREATE
├── db/
│   └── migrations/
│       └── 00001_schema_metadata.sql    CREATE
├── queries/
│   └── .gitkeep                         CREATE
├── internal/testsupport/
│   ├── postgres.go                      CREATE
│   └── http.go                          CREATE
├── test/
│   └── integration/
│       └── healthz_test.go              CREATE
└── docs/
    └── superpowers/
        ├── specs/                        (already exists)
        └── plans/                        (already exists)
```

**Responsibility per file:**
- `go.mod` — Go module declaration, dependencies
- `Makefile` — canonical entrypoints: `build`, `run-api`, `run-worker`, `lint`, `test`, `unit`, `integration`, `migrate-up`, `migrate-down`, `sqlc`, `docker-build`, `docker-up`, `docker-down`
- `docker-compose.yml` — local dev: postgres:16, minio, otel-collector
- `Dockerfile.api`/`Dockerfile.worker` — multi-stage, final stage `gcr.io/distroless/static`, single static binary
- `.golangci.yml` — strict preset (gosec, errcheck, govet, staticcheck, gocritic, revive, unused, ineffassign, bodyclose, contextcheck)
- `.gitignore` — Go artifacts, env files, coverage, IDE, docker volumes
- `cmd/api/main.go` — loads config, builds logger, builds http router, starts server, graceful shutdown on SIGTERM
- `cmd/worker/main.go` — same bootstrap minus HTTP; empty worker registry for now
- `internal/platform/config/config.go` — single `Config` struct with all env vars, `Load()` using envconfig; validation
- `internal/platform/logging/logger.go` — slog JSON handler factory, redaction-ready; `NewLogger(env, level)` returns `*slog.Logger`
- `internal/adapters/http/router.go` — builds chi router, registers health handlers, middleware stack (recover, request-id, log)
- `internal/adapters/http/health.go` — `HealthHandler` with `/healthz` (liveness) and `/readyz` (stub — real DB check arrives Plan 02)
- `db/migrations/00001_schema_metadata.sql` — creates a trivial `schema_metadata(key TEXT PK, value TEXT)` table so migrations runner has something to do
- `queries/.gitkeep` — placeholder; sqlc needs the directory to exist
- `sqlc.yaml` — config pointing at `queries/` and `db/migrations/` with pgx/v5 output
- `internal/testsupport/postgres.go` — `SpawnPostgres(t)` helper using testcontainers-go; returns DSN + cleanup
- `internal/testsupport/http.go` — `SpawnAPI(t, dsn)` helper that boots `cmd/api` in-process, returns base URL + cleanup
- `test/integration/healthz_test.go` — integration test: spin Postgres container, boot API, curl `/healthz`, assert 200

---

## Prerequisites

Engineer must have installed locally before starting:
- Go 1.22 or newer (`go version`)
- Docker Desktop or equivalent (`docker --version`, `docker compose version`)
- `git` (`git --version`)
- Optional for faster local iteration: `make`, `curl`

The plan does **not** require pre-installing `goose`, `sqlc`, or `golangci-lint` — they are run via `go run` or Docker.

---

## Task 1: Initialize Go module and git repository

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/go.mod`
- Create: `/Users/samuelmauli/dev/PaymentsHub/.gitignore`
- Create: `/Users/samuelmauli/dev/PaymentsHub/.dockerignore`
- Create: `/Users/samuelmauli/dev/PaymentsHub/README.md`

- [ ] **Step 1: Initialize Go module**

Run:
```bash
cd /Users/samuelmauli/dev/PaymentsHub
go mod init github.com/vanlink-ltda/paymentshub
```

Expected: `go.mod` created with module path `github.com/vanlink-ltda/paymentshub` and `go 1.22`.

- [ ] **Step 2: Create `.gitignore`**

Create `/Users/samuelmauli/dev/PaymentsHub/.gitignore` with content:

```gitignore
# Binaries
/bin/
/dist/
paymentshub-api
paymentshub-worker
*.exe
*.test
*.out

# Go build
/vendor/

# Coverage
coverage.out
coverage.html

# Env and secrets
.env
.env.*
!.env.example
*.pem
*.key
secrets/

# IDE
.idea/
.vscode/
*.swp
.DS_Store

# Docker volumes (local dev data)
.docker-data/

# testdata scratch
testdata/_scratch/
```

- [ ] **Step 3: Create `.dockerignore`**

Create `/Users/samuelmauli/dev/PaymentsHub/.dockerignore`:

```dockerignore
.git
.gitignore
.github
.idea
.vscode
.DS_Store
docs/
*.md
!README.md
bin/
dist/
coverage.out
coverage.html
.env
.env.*
```

- [ ] **Step 4: Create a minimal `README.md`**

Create `/Users/samuelmauli/dev/PaymentsHub/README.md`:

```markdown
# PaymentsHub

Orquestrador SaaS de pagamentos bancários. Receive payments from client ERPs, pre-validate against bank APIs, wait for human approval, execute via PIX REST + CNAB 240 SFTP.

See [docs/superpowers/specs/](docs/superpowers/specs/) for the full design spec and [docs/superpowers/plans/](docs/superpowers/plans/) for implementation plans.

## Quickstart (local dev)

```bash
make docker-up        # postgres + minio
make migrate-up       # apply DB migrations
make run-api          # HTTP server on :8080
make test             # unit + integration tests
```

## Binaries

- `cmd/api` — HTTP server (ingress, query, approval, admin, webhooks)
- `cmd/worker` — River workers + cron jobs (polling, reconciliation)
```

- [ ] **Step 5: Initialize git repository**

Run:
```bash
cd /Users/samuelmauli/dev/PaymentsHub
git init
git add .gitignore .dockerignore README.md go.mod docs/
git status
```

Expected: `.gitignore`, `.dockerignore`, `README.md`, `go.mod`, and `docs/superpowers/specs/2026-04-11-phase1-core-itau-design.md` + `docs/superpowers/plans/2026-04-11-phase1-01-foundations.md` are staged.

- [ ] **Step 6: First commit**

Run:
```bash
git commit -m "chore: bootstrap repo with go module, gitignore, spec and plan"
```

Expected: commit created on `main` branch.

---

## Task 2: Create directory skeleton and placeholder files

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/cmd/api/.gitkeep`
- Create: `/Users/samuelmauli/dev/PaymentsHub/cmd/worker/.gitkeep`
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/platform/config/.gitkeep`
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/platform/logging/.gitkeep`
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/adapters/http/.gitkeep`
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/testsupport/.gitkeep`
- Create: `/Users/samuelmauli/dev/PaymentsHub/db/migrations/.gitkeep`
- Create: `/Users/samuelmauli/dev/PaymentsHub/queries/.gitkeep`
- Create: `/Users/samuelmauli/dev/PaymentsHub/test/integration/.gitkeep`

- [ ] **Step 1: Create all skeleton directories via a single shell command**

Run:
```bash
cd /Users/samuelmauli/dev/PaymentsHub
mkdir -p cmd/api cmd/worker \
  internal/platform/config internal/platform/logging \
  internal/adapters/http \
  internal/testsupport \
  db/migrations queries \
  test/integration
for d in cmd/api cmd/worker internal/platform/config internal/platform/logging internal/adapters/http internal/testsupport db/migrations queries test/integration; do
  touch "$d/.gitkeep"
done
```

- [ ] **Step 2: Verify the tree**

Run:
```bash
find /Users/samuelmauli/dev/PaymentsHub -type d -not -path '*/.git*' -not -path '*/docs*'
```

Expected: all directories from the file structure section exist.

- [ ] **Step 3: Commit the skeleton**

Run:
```bash
git add cmd/ internal/ db/ queries/ test/
git commit -m "chore: create hexagonal directory skeleton"
```

---

## Task 3: Add core Go dependencies

**Files:**
- Modify: `/Users/samuelmauli/dev/PaymentsHub/go.mod`
- Create: `/Users/samuelmauli/dev/PaymentsHub/go.sum`

- [ ] **Step 1: Add HTTP, config, logging, and test dependencies**

Run:
```bash
cd /Users/samuelmauli/dev/PaymentsHub
go get github.com/go-chi/chi/v5@latest
go get github.com/go-chi/chi/v5/middleware@latest
go get github.com/kelseyhightower/envconfig@latest
go get github.com/stretchr/testify@latest
go mod tidy
```

Expected: `go.mod` shows `chi/v5`, `envconfig`, `testify` as direct dependencies. `go.sum` exists.

- [ ] **Step 2: Verify build is still green**

Run:
```bash
go build ./...
```

Expected: no errors (there's no code yet, so the build is effectively a no-op but validates the module).

- [ ] **Step 3: Commit dependencies**

Run:
```bash
git add go.mod go.sum
git commit -m "chore: add chi, envconfig, testify as direct dependencies"
```

---

## Task 4: Implement `internal/platform/config` with tests

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/platform/config/config.go`
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/platform/config/config_test.go`

- [ ] **Step 1: Write the failing test**

Create `/Users/samuelmauli/dev/PaymentsHub/internal/platform/config/config_test.go`:

```go
package config_test

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/platform/config"
)

func TestLoad_WithAllRequiredEnvVars(t *testing.T) {
	t.Setenv("PH_ENV", "dev")
	t.Setenv("PH_LOG_LEVEL", "debug")
	t.Setenv("PH_HTTP_ADDR", ":8080")
	t.Setenv("PH_DATABASE_URL", "postgres://localhost/paymentshub?sslmode=disable")
	t.Setenv("PH_SHUTDOWN_TIMEOUT_SECONDS", "15")

	cfg, err := config.Load()
	require.NoError(t, err)
	require.Equal(t, "dev", cfg.Env)
	require.Equal(t, "debug", cfg.LogLevel)
	require.Equal(t, ":8080", cfg.HTTPAddr)
	require.Equal(t, "postgres://localhost/paymentshub?sslmode=disable", cfg.DatabaseURL)
	require.Equal(t, 15, cfg.ShutdownTimeoutSeconds)
}

func TestLoad_FailsWhenDatabaseURLMissing(t *testing.T) {
	os.Unsetenv("PH_DATABASE_URL")
	_, err := config.Load()
	require.Error(t, err)
}

func TestLoad_AppliesDefaultsForOptionalFields(t *testing.T) {
	t.Setenv("PH_DATABASE_URL", "postgres://localhost/paymentshub?sslmode=disable")
	t.Setenv("PH_ENV", "dev")

	cfg, err := config.Load()
	require.NoError(t, err)
	require.Equal(t, "info", cfg.LogLevel)
	require.Equal(t, ":8080", cfg.HTTPAddr)
	require.Equal(t, 30, cfg.ShutdownTimeoutSeconds)
}
```

- [ ] **Step 2: Run the test — expect compile failure**

Run:
```bash
go test ./internal/platform/config/...
```

Expected: build fails because `config.Load` and `config.Config` do not exist yet.

- [ ] **Step 3: Implement `config.go`**

Create `/Users/samuelmauli/dev/PaymentsHub/internal/platform/config/config.go`:

```go
// Package config loads PaymentsHub configuration from the process environment.
//
// All environment variables are prefixed with PH_ to avoid collisions.
// Required variables fail fast on Load().
package config

import (
	"fmt"

	"github.com/kelseyhightower/envconfig"
)

// Config is the full runtime configuration for both cmd/api and cmd/worker.
// Fields added here must also be documented in README.md.
type Config struct {
	Env                    string `envconfig:"ENV" default:"dev"`
	LogLevel               string `envconfig:"LOG_LEVEL" default:"info"`
	HTTPAddr               string `envconfig:"HTTP_ADDR" default:":8080"`
	DatabaseURL            string `envconfig:"DATABASE_URL" required:"true"`
	ShutdownTimeoutSeconds int    `envconfig:"SHUTDOWN_TIMEOUT_SECONDS" default:"30"`
}

// Load reads environment variables with prefix PH_ into a Config.
// Returns an error if a required variable is missing or malformed.
func Load() (Config, error) {
	var cfg Config
	if err := envconfig.Process("PH", &cfg); err != nil {
		return Config{}, fmt.Errorf("config: %w", err)
	}
	return cfg, nil
}
```

- [ ] **Step 4: Run the tests — expect pass**

Run:
```bash
go test ./internal/platform/config/... -v
```

Expected: all three tests PASS.

- [ ] **Step 5: Remove the old `.gitkeep`**

Run:
```bash
rm internal/platform/config/.gitkeep
```

- [ ] **Step 6: Commit**

Run:
```bash
git add internal/platform/config/ go.sum
git commit -m "feat(config): load PH_-prefixed env vars via envconfig with defaults"
```

---

## Task 5: Implement `internal/platform/logging` with tests

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/platform/logging/logger.go`
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/platform/logging/logger_test.go`

- [ ] **Step 1: Write the failing test**

Create `/Users/samuelmauli/dev/PaymentsHub/internal/platform/logging/logger_test.go`:

```go
package logging_test

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/platform/logging"
)

func TestNewLogger_OutputsJSONWithBaseFields(t *testing.T) {
	var buf bytes.Buffer
	logger := logging.NewLogger(logging.Options{
		Env:     "test",
		Level:   "info",
		Service: "paymentshub-api",
		Writer:  &buf,
	})

	logger.Info("hello", slog.String("payment_id", "abc-123"))

	var entry map[string]any
	require.NoError(t, json.Unmarshal(buf.Bytes(), &entry))
	require.Equal(t, "hello", entry["msg"])
	require.Equal(t, "paymentshub-api", entry["service"])
	require.Equal(t, "test", entry["env"])
	require.Equal(t, "abc-123", entry["payment_id"])
	require.Contains(t, entry, "time")
	require.Equal(t, "INFO", entry["level"])
}

func TestNewLogger_RespectsLevel(t *testing.T) {
	var buf bytes.Buffer
	logger := logging.NewLogger(logging.Options{
		Env:     "test",
		Level:   "warn",
		Service: "paymentshub-api",
		Writer:  &buf,
	})

	logger.Info("should not appear")
	logger.Warn("should appear")

	output := buf.String()
	require.NotContains(t, output, "should not appear")
	require.Contains(t, output, "should appear")
}

func TestNewLogger_DefaultsLevelToInfo(t *testing.T) {
	var buf bytes.Buffer
	logger := logging.NewLogger(logging.Options{
		Env:     "test",
		Level:   "",
		Service: "paymentshub-api",
		Writer:  &buf,
	})

	logger.Info("visible")
	require.Contains(t, buf.String(), "visible")
}
```

- [ ] **Step 2: Run — expect compile failure**

Run:
```bash
go test ./internal/platform/logging/...
```

Expected: build fails (`logging.NewLogger` / `logging.Options` undefined).

- [ ] **Step 3: Implement `logger.go`**

Create `/Users/samuelmauli/dev/PaymentsHub/internal/platform/logging/logger.go`:

```go
// Package logging builds slog JSON loggers with base fields attached to every record.
//
// The redaction layer for LGPD-sensitive fields is added in Plan 10; this package
// only provides the base JSON handler here.
package logging

import (
	"io"
	"log/slog"
	"os"
	"strings"
)

// Options configures NewLogger.
type Options struct {
	Env     string
	Level   string
	Service string
	Writer  io.Writer
}

// NewLogger returns an *slog.Logger whose handler emits JSON records and always
// includes "service" and "env" attributes. Level defaults to info when blank or
// unrecognized. Writer defaults to os.Stdout when nil.
func NewLogger(opts Options) *slog.Logger {
	w := opts.Writer
	if w == nil {
		w = os.Stdout
	}

	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level: parseLevel(opts.Level),
	})

	return slog.New(handler).With(
		slog.String("service", opts.Service),
		slog.String("env", opts.Env),
	)
}

func parseLevel(raw string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
```

- [ ] **Step 4: Run — expect pass**

Run:
```bash
go test ./internal/platform/logging/... -v
```

Expected: 3 tests PASS.

- [ ] **Step 5: Clean placeholder and commit**

Run:
```bash
rm internal/platform/logging/.gitkeep
git add internal/platform/logging/
git commit -m "feat(logging): slog JSON factory with base service/env fields"
```

---

## Task 6: Implement HTTP router with health endpoints and tests

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/adapters/http/health.go`
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/adapters/http/router.go`
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/adapters/http/health_test.go`

- [ ] **Step 1: Write the failing test**

Create `/Users/samuelmauli/dev/PaymentsHub/internal/adapters/http/health_test.go`:

```go
package http_test

import (
	"encoding/json"
	"io"
	nethttp "net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"

	httpadapter "github.com/vanlink-ltda/paymentshub/internal/adapters/http"
	"github.com/vanlink-ltda/paymentshub/internal/platform/logging"
)

func newTestRouter(t *testing.T) nethttp.Handler {
	t.Helper()
	logger := logging.NewLogger(logging.Options{
		Env:     "test",
		Level:   "error",
		Service: "paymentshub-api",
	})
	return httpadapter.NewRouter(httpadapter.RouterDeps{
		Logger: logger,
	})
}

func TestHealthz_Returns200AndOK(t *testing.T) {
	router := newTestRouter(t)

	req := httptest.NewRequest(nethttp.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	require.Equal(t, nethttp.StatusOK, rec.Code)
	body, err := io.ReadAll(rec.Body)
	require.NoError(t, err)

	var payload map[string]any
	require.NoError(t, json.Unmarshal(body, &payload))
	require.Equal(t, "ok", payload["status"])
}

func TestReadyz_Returns200WhenNoChecksConfigured(t *testing.T) {
	router := newTestRouter(t)

	req := httptest.NewRequest(nethttp.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	require.Equal(t, nethttp.StatusOK, rec.Code)
}

func TestUnknownRoute_Returns404(t *testing.T) {
	router := newTestRouter(t)

	req := httptest.NewRequest(nethttp.MethodGet, "/nope", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	require.Equal(t, nethttp.StatusNotFound, rec.Code)
}
```

- [ ] **Step 2: Run — expect compile failure**

Run:
```bash
go test ./internal/adapters/http/...
```

Expected: build fails (`httpadapter.NewRouter`, `RouterDeps` undefined).

- [ ] **Step 3: Implement `health.go`**

Create `/Users/samuelmauli/dev/PaymentsHub/internal/adapters/http/health.go`:

```go
package http

import (
	"encoding/json"
	"net/http"
)

// ReadinessCheck is a function that returns nil when the dependency is healthy.
// Plan 02 wires a Postgres check here; Plan 07 wires an SFTP check.
type ReadinessCheck func(r *http.Request) error

// HealthHandlers holds the liveness and readiness HTTP handlers.
type HealthHandlers struct {
	readiness []ReadinessCheck
}

// NewHealthHandlers builds handlers from zero or more readiness checks.
func NewHealthHandlers(checks ...ReadinessCheck) *HealthHandlers {
	return &HealthHandlers{readiness: checks}
}

// Livez answers /healthz. It never fails — liveness only cares that the process runs.
func (h *HealthHandlers) Livez(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// Readyz answers /readyz. It runs every configured check sequentially and returns
// 503 with a breakdown on the first failure.
func (h *HealthHandlers) Readyz(w http.ResponseWriter, r *http.Request) {
	for _, check := range h.readiness {
		if err := check(r); err != nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{
				"status": "unready",
				"error":  err.Error(),
			})
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func writeJSON(w http.ResponseWriter, code int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(body)
}
```

- [ ] **Step 4: Implement `router.go`**

Create `/Users/samuelmauli/dev/PaymentsHub/internal/adapters/http/router.go`:

```go
package http

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// RouterDeps is the dependency bundle NewRouter needs.
// It grows in later plans (DB, use cases, auth middleware...).
type RouterDeps struct {
	Logger           *slog.Logger
	ReadinessChecks  []ReadinessCheck
	RequestTimeout   time.Duration
}

// NewRouter builds the chi router with the middleware stack and all routes.
func NewRouter(deps RouterDeps) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	if deps.RequestTimeout > 0 {
		r.Use(middleware.Timeout(deps.RequestTimeout))
	}

	health := NewHealthHandlers(deps.ReadinessChecks...)
	r.Get("/healthz", health.Livez)
	r.Get("/readyz", health.Readyz)

	return r
}
```

- [ ] **Step 5: Run — expect pass**

Run:
```bash
go test ./internal/adapters/http/... -v
```

Expected: 3 tests PASS.

- [ ] **Step 6: Clean and commit**

Run:
```bash
rm internal/adapters/http/.gitkeep
git add internal/adapters/http/
git commit -m "feat(http): chi router with /healthz and /readyz handlers"
```

---

## Task 7: Implement `cmd/api/main.go`

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/cmd/api/main.go`

- [ ] **Step 1: Write `main.go`**

Create `/Users/samuelmauli/dev/PaymentsHub/cmd/api/main.go`:

```go
// Command paymentshub-api is the HTTP ingress binary.
//
// It wires the configuration, logger, and chi router, then serves HTTP until
// SIGTERM/SIGINT, at which point it drains in-flight requests within the
// configured shutdown timeout.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	httpadapter "github.com/vanlink-ltda/paymentshub/internal/adapters/http"
	"github.com/vanlink-ltda/paymentshub/internal/platform/config"
	"github.com/vanlink-ltda/paymentshub/internal/platform/logging"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "fatal: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	logger := logging.NewLogger(logging.Options{
		Env:     cfg.Env,
		Level:   cfg.LogLevel,
		Service: "paymentshub-api",
	})

	router := httpadapter.NewRouter(httpadapter.RouterDeps{
		Logger:         logger,
		RequestTimeout: 30 * time.Second,
	})

	server := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      90 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	serverErr := make(chan error, 1)
	go func() {
		logger.Info("http server starting", slog.String("addr", cfg.HTTPAddr))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		return fmt.Errorf("http server: %w", err)
	case sig := <-stop:
		logger.Info("shutdown signal received", slog.String("signal", sig.String()))
	}

	timeout := time.Duration(cfg.ShutdownTimeoutSeconds) * time.Second
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		return fmt.Errorf("graceful shutdown: %w", err)
	}

	logger.Info("shutdown complete")
	return nil
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
go build ./cmd/api
```

Expected: build succeeds (no binary written because `go build` without `-o` inside module does not write, but compile must be clean).

- [ ] **Step 3: Smoke-run the binary locally**

Run:
```bash
PH_DATABASE_URL="postgres://localhost/nodb?sslmode=disable" PH_HTTP_ADDR=":8081" go run ./cmd/api &
sleep 1
curl -sf http://localhost:8081/healthz
kill %1
wait %1 2>/dev/null || true
```

Expected: `curl` prints `{"status":"ok"}`. Server exits cleanly.

- [ ] **Step 4: Clean and commit**

Run:
```bash
rm cmd/api/.gitkeep
git add cmd/api/
git commit -m "feat(api): http server bootstrap with graceful shutdown"
```

---

## Task 8: Implement `cmd/worker/main.go` stub

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/cmd/worker/main.go`

- [ ] **Step 1: Write `main.go`**

Create `/Users/samuelmauli/dev/PaymentsHub/cmd/worker/main.go`:

```go
// Command paymentshub-worker hosts River workers and cron jobs.
//
// In this plan the worker only logs its start/stop lifecycle. Plan 08 wires
// the actual River client and job registry.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/vanlink-ltda/paymentshub/internal/platform/config"
	"github.com/vanlink-ltda/paymentshub/internal/platform/logging"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "fatal: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	logger := logging.NewLogger(logging.Options{
		Env:     cfg.Env,
		Level:   cfg.LogLevel,
		Service: "paymentshub-worker",
	})

	logger.Info("worker starting", slog.String("env", cfg.Env))

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	select {
	case <-ctx.Done():
	case sig := <-stop:
		logger.Info("shutdown signal received", slog.String("signal", sig.String()))
	}

	logger.Info("worker stopped")
	return nil
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
go build ./cmd/worker
```

Expected: clean build.

- [ ] **Step 3: Clean and commit**

Run:
```bash
rm cmd/worker/.gitkeep
git add cmd/worker/
git commit -m "feat(worker): worker binary stub with lifecycle logging"
```

---

## Task 9: Create `docker-compose.yml` and bootstrap Postgres + MinIO

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/docker-compose.yml`
- Create: `/Users/samuelmauli/dev/PaymentsHub/.env.example`

- [ ] **Step 1: Write `docker-compose.yml`**

Create `/Users/samuelmauli/dev/PaymentsHub/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: paymentshub-postgres
    environment:
      POSTGRES_USER: paymentshub
      POSTGRES_PASSWORD: paymentshub
      POSTGRES_DB: paymentshub
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U paymentshub -d paymentshub"]
      interval: 5s
      timeout: 5s
      retries: 10

  minio:
    image: minio/minio:latest
    container_name: paymentshub-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: paymentshub
      MINIO_ROOT_PASSWORD: paymentshub
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres-data:
  minio-data:
```

- [ ] **Step 2: Write `.env.example`**

Create `/Users/samuelmauli/dev/PaymentsHub/.env.example`:

```env
PH_ENV=dev
PH_LOG_LEVEL=debug
PH_HTTP_ADDR=:8080
PH_DATABASE_URL=postgres://paymentshub:paymentshub@localhost:5432/paymentshub?sslmode=disable
PH_SHUTDOWN_TIMEOUT_SECONDS=30
```

- [ ] **Step 3: Start the stack**

Run:
```bash
docker compose up -d
docker compose ps
```

Expected: `postgres` and `minio` are `Up (healthy)` after a few seconds.

- [ ] **Step 4: Verify Postgres is reachable**

Run:
```bash
docker compose exec -T postgres psql -U paymentshub -d paymentshub -c 'SELECT 1;'
```

Expected: returns `1`.

- [ ] **Step 5: Commit compose files**

Run:
```bash
git add docker-compose.yml .env.example
git commit -m "chore(docker): docker-compose with postgres and minio for local dev"
```

---

## Task 10: Create the first goose migration

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/db/migrations/00001_schema_metadata.sql`

- [ ] **Step 1: Write the migration**

Create `/Users/samuelmauli/dev/PaymentsHub/db/migrations/00001_schema_metadata.sql`:

```sql
-- +goose Up
-- +goose StatementBegin
CREATE TABLE schema_metadata (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO schema_metadata (key, value) VALUES
    ('application',  'paymentshub'),
    ('plan_applied', '01-foundations');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE schema_metadata;
-- +goose StatementEnd
```

- [ ] **Step 2: Run goose via `go run`**

Run:
```bash
go run github.com/pressly/goose/v3/cmd/goose@v3.20.0 \
  -dir db/migrations postgres \
  "postgres://paymentshub:paymentshub@localhost:5432/paymentshub?sslmode=disable" up
```

Expected: `OK` and log line `Applied 1 migrations`. Goose auto-creates `goose_db_version` table.

- [ ] **Step 3: Verify the table exists**

Run:
```bash
docker compose exec -T postgres psql -U paymentshub -d paymentshub -c "SELECT key, value FROM schema_metadata;"
```

Expected: two rows (`application=paymentshub`, `plan_applied=01-foundations`).

- [ ] **Step 4: Clean placeholder and commit**

Run:
```bash
rm db/migrations/.gitkeep
git add db/migrations/
git commit -m "feat(db): first goose migration creating schema_metadata"
```

---

## Task 11: Create `sqlc.yaml`

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/sqlc.yaml`
- Create: `/Users/samuelmauli/dev/PaymentsHub/queries/dummy.sql`
- Modify: `/Users/samuelmauli/dev/PaymentsHub/queries/.gitkeep` (delete)

- [ ] **Step 1: Write `sqlc.yaml`**

Create `/Users/samuelmauli/dev/PaymentsHub/sqlc.yaml`:

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "queries"
    schema: "db/migrations"
    gen:
      go:
        package: "dbgen"
        out: "internal/adapters/db/dbgen"
        sql_package: "pgx/v5"
        emit_json_tags: false
        emit_prepared_queries: false
        emit_interface: true
        emit_exact_table_names: false
        emit_empty_slices: true
        emit_enum_valid_method: true
        emit_all_enum_values: true
```

- [ ] **Step 2: Write a trivial query so sqlc has something to generate**

Create `/Users/samuelmauli/dev/PaymentsHub/queries/dummy.sql`:

```sql
-- name: GetSchemaMetadataValue :one
SELECT value FROM schema_metadata WHERE key = $1;
```

- [ ] **Step 3: Run sqlc via Docker (no local install needed)**

Run:
```bash
docker run --rm -v "$(pwd):/src" -w /src sqlc/sqlc:1.26.0 generate
```

Expected: `internal/adapters/db/dbgen/` is created with `db.go`, `models.go`, `dummy.sql.go`, and `querier.go`.

- [ ] **Step 4: Verify the generated code builds**

Run:
```bash
go mod tidy
go build ./...
```

Expected: clean build. `pgx/v5` is added to `go.sum`.

- [ ] **Step 5: Clean placeholder and commit**

Run:
```bash
rm queries/.gitkeep
git add sqlc.yaml queries/ internal/adapters/db/ go.mod go.sum
git commit -m "chore(sqlc): wire sqlc with pgx/v5 output and dummy query"
```

---

## Task 12: Add `golangci-lint` config and make it pass

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/.golangci.yml`

- [ ] **Step 1: Write `.golangci.yml`**

Create `/Users/samuelmauli/dev/PaymentsHub/.golangci.yml`:

```yaml
run:
  timeout: 5m
  tests: true
  skip-dirs:
    - internal/adapters/db/dbgen
  go: "1.22"

linters:
  disable-all: true
  enable:
    - errcheck
    - gosec
    - govet
    - staticcheck
    - unused
    - ineffassign
    - bodyclose
    - contextcheck
    - gocritic
    - revive
    - unconvert
    - misspell

linters-settings:
  gosec:
    excludes:
      - G104

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - gosec
        - errcheck
```

- [ ] **Step 2: Run golangci-lint via Docker**

Run:
```bash
docker run --rm -v "$(pwd):/src" -w /src -e GOFLAGS=-buildvcs=false \
  golangci/golangci-lint:v1.57.2 golangci-lint run ./...
```

Expected: exit code 0, no issues reported.

- [ ] **Step 3: Commit**

Run:
```bash
git add .golangci.yml
git commit -m "chore(lint): strict golangci-lint preset"
```

---

## Task 13: Add testcontainers-go Postgres helper

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/testsupport/postgres.go`

- [ ] **Step 1: Add dependencies**

Run:
```bash
go get github.com/testcontainers/testcontainers-go@v0.29.1
go get github.com/testcontainers/testcontainers-go/modules/postgres@v0.29.1
go get github.com/jackc/pgx/v5@latest
go mod tidy
```

Expected: `go.mod` has new dependencies, `go.sum` updated.

- [ ] **Step 2: Implement the helper**

Create `/Users/samuelmauli/dev/PaymentsHub/internal/testsupport/postgres.go`:

```go
// Package testsupport provides fixtures shared across integration tests.
//
// SpawnPostgres starts a disposable Postgres container, applies all goose
// migrations from db/migrations, and returns the DSN plus a cleanup function.
package testsupport

import (
	"context"
	"database/sql"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/pressly/goose/v3"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// SpawnPostgres boots a postgres:16-alpine container, runs all migrations,
// and returns the DSN. The container is terminated at test cleanup.
func SpawnPostgres(t *testing.T) string {
	t.Helper()
	ctx := context.Background()

	container, err := tcpostgres.RunContainer(ctx,
		testcontainers.WithImage("postgres:16-alpine"),
		tcpostgres.WithDatabase("paymentshub"),
		tcpostgres.WithUsername("paymentshub"),
		tcpostgres.WithPassword("paymentshub"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(60*time.Second),
		),
	)
	require.NoError(t, err, "start postgres container")

	t.Cleanup(func() {
		_ = container.Terminate(ctx)
	})

	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)

	db, err := sql.Open("pgx", dsn)
	require.NoError(t, err)
	defer db.Close()

	require.NoError(t, goose.SetDialect("postgres"))
	require.NoError(t, goose.Up(db, migrationsDir(t)))

	return dsn
}

func migrationsDir(t *testing.T) string {
	t.Helper()
	_, thisFile, _, ok := runtime.Caller(0)
	require.True(t, ok, "runtime.Caller failed")
	return filepath.Join(filepath.Dir(thisFile), "..", "..", "db", "migrations")
}
```

- [ ] **Step 3: Add goose as a library dependency**

Run:
```bash
go get github.com/pressly/goose/v3@v3.20.0
go mod tidy
go build ./...
```

Expected: clean build.

- [ ] **Step 4: Clean and commit**

Run:
```bash
rm internal/testsupport/.gitkeep
git add internal/testsupport/ go.mod go.sum
git commit -m "test(support): testcontainers postgres helper with goose migrations"
```

---

## Task 14: Add in-process HTTP test helper

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/internal/testsupport/http.go`

- [ ] **Step 1: Implement the helper**

Create `/Users/samuelmauli/dev/PaymentsHub/internal/testsupport/http.go`:

```go
package testsupport

import (
	"context"
	nethttp "net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	httpadapter "github.com/vanlink-ltda/paymentshub/internal/adapters/http"
	"github.com/vanlink-ltda/paymentshub/internal/platform/logging"
)

// SpawnAPI boots the PaymentsHub HTTP router in-process using httptest.Server
// and returns the base URL plus the underlying server so tests can close it.
// This does NOT open Postgres connections — it only exercises HTTP plumbing.
//
// Plan 02 introduces a variant that wires a real DB pool.
func SpawnAPI(t *testing.T) (baseURL string, cleanup func()) {
	t.Helper()
	logger := logging.NewLogger(logging.Options{
		Env:     "test",
		Level:   "error",
		Service: "paymentshub-api",
	})

	router := httpadapter.NewRouter(httpadapter.RouterDeps{
		Logger:         logger,
		RequestTimeout: 5 * time.Second,
	})

	srv := httptest.NewServer(router)

	cleanup = func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = ctx
		srv.Close()
	}

	baseURL = srv.URL
	return baseURL, cleanup
}

// HTTPClient returns a default *nethttp.Client with a reasonable timeout for tests.
func HTTPClient() *nethttp.Client {
	return &nethttp.Client{Timeout: 10 * time.Second}
}
```

- [ ] **Step 2: Build**

Run:
```bash
go build ./...
```

Expected: clean build.

- [ ] **Step 3: Commit**

Run:
```bash
git add internal/testsupport/http.go
git commit -m "test(support): in-process API spawn helper"
```

---

## Task 15: Write the end-to-end integration test

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/test/integration/healthz_test.go`

- [ ] **Step 1: Write the test**

Create `/Users/samuelmauli/dev/PaymentsHub/test/integration/healthz_test.go`:

```go
//go:build integration

package integration_test

import (
	"encoding/json"
	"io"
	nethttp "net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/testsupport"
)

func TestIntegration_Healthz(t *testing.T) {
	baseURL, cleanup := testsupport.SpawnAPI(t)
	defer cleanup()

	client := testsupport.HTTPClient()
	resp, err := client.Get(baseURL + "/healthz")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, nethttp.StatusOK, resp.StatusCode)
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	var payload map[string]string
	require.NoError(t, json.Unmarshal(body, &payload))
	require.Equal(t, "ok", payload["status"])
}

func TestIntegration_Readyz(t *testing.T) {
	baseURL, cleanup := testsupport.SpawnAPI(t)
	defer cleanup()

	client := testsupport.HTTPClient()
	resp, err := client.Get(baseURL + "/readyz")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, nethttp.StatusOK, resp.StatusCode)
}

func TestIntegration_PostgresSpawn(t *testing.T) {
	dsn := testsupport.SpawnPostgres(t)
	require.NotEmpty(t, dsn)
}
```

- [ ] **Step 2: Run integration tests**

Run:
```bash
go test -tags=integration ./test/integration/... -v
```

Expected: all three tests PASS (`TestIntegration_PostgresSpawn` takes ~10–30s on first run as it pulls the postgres image).

- [ ] **Step 3: Commit**

Run:
```bash
rm test/integration/.gitkeep
git add test/integration/
git commit -m "test(integration): healthz and postgres spawn smoke tests"
```

---

## Task 16: Write the `Makefile`

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/Makefile`

- [ ] **Step 1: Write the Makefile**

Create `/Users/samuelmauli/dev/PaymentsHub/Makefile`:

```makefile
SHELL := /bin/bash

MODULE      := github.com/vanlink-ltda/paymentshub
BIN_DIR     := bin
API_BIN     := $(BIN_DIR)/paymentshub-api
WORKER_BIN  := $(BIN_DIR)/paymentshub-worker

DATABASE_URL ?= postgres://paymentshub:paymentshub@localhost:5432/paymentshub?sslmode=disable

GOOSE_IMG    := gcr.io/goose-cli:v3.20.0
SQLC_IMG     := sqlc/sqlc:1.26.0
LINT_IMG     := golangci/golangci-lint:v1.57.2

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: tidy
tidy: ## go mod tidy
	go mod tidy

.PHONY: build
build: build-api build-worker ## Build both binaries

.PHONY: build-api
build-api: ## Build paymentshub-api binary
	@mkdir -p $(BIN_DIR)
	CGO_ENABLED=0 go build -trimpath -o $(API_BIN) ./cmd/api

.PHONY: build-worker
build-worker: ## Build paymentshub-worker binary
	@mkdir -p $(BIN_DIR)
	CGO_ENABLED=0 go build -trimpath -o $(WORKER_BIN) ./cmd/worker

.PHONY: run-api
run-api: ## Run the API in the foreground
	PH_DATABASE_URL="$(DATABASE_URL)" go run ./cmd/api

.PHONY: run-worker
run-worker: ## Run the worker in the foreground
	PH_DATABASE_URL="$(DATABASE_URL)" go run ./cmd/worker

.PHONY: unit
unit: ## Run unit tests (excludes integration)
	go test -race -count=1 ./internal/... ./cmd/...

.PHONY: integration
integration: ## Run integration tests (requires docker)
	go test -tags=integration -race -count=1 -timeout 5m ./test/integration/...

.PHONY: test
test: unit integration ## Run unit + integration tests

.PHONY: cover
cover: ## Run unit tests with coverage report
	go test -race -count=1 -coverprofile=coverage.out ./internal/... ./cmd/...
	go tool cover -func=coverage.out

.PHONY: lint
lint: ## Run golangci-lint via docker
	docker run --rm -v $(CURDIR):/src -w /src -e GOFLAGS=-buildvcs=false $(LINT_IMG) golangci-lint run ./...

.PHONY: sqlc
sqlc: ## Regenerate sqlc code
	docker run --rm -v $(CURDIR):/src -w /src $(SQLC_IMG) generate

.PHONY: migrate-up
migrate-up: ## Apply all pending migrations
	go run github.com/pressly/goose/v3/cmd/goose@v3.20.0 -dir db/migrations postgres "$(DATABASE_URL)" up

.PHONY: migrate-down
migrate-down: ## Roll back the last migration
	go run github.com/pressly/goose/v3/cmd/goose@v3.20.0 -dir db/migrations postgres "$(DATABASE_URL)" down

.PHONY: migrate-status
migrate-status: ## Show migration status
	go run github.com/pressly/goose/v3/cmd/goose@v3.20.0 -dir db/migrations postgres "$(DATABASE_URL)" status

.PHONY: docker-up
docker-up: ## Start postgres and minio
	docker compose up -d

.PHONY: docker-down
docker-down: ## Stop postgres and minio
	docker compose down

.PHONY: docker-build
docker-build: ## Build api and worker images
	docker build -f Dockerfile.api -t paymentshub-api:dev .
	docker build -f Dockerfile.worker -t paymentshub-worker:dev .

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf $(BIN_DIR) coverage.out coverage.html
```

- [ ] **Step 2: Test the unit target**

Run:
```bash
make unit
```

Expected: all unit tests from Tasks 4, 5, 6 pass.

- [ ] **Step 3: Test the build target**

Run:
```bash
make build
ls -la bin/
```

Expected: `bin/paymentshub-api` and `bin/paymentshub-worker` exist.

- [ ] **Step 4: Commit**

Run:
```bash
git add Makefile
git commit -m "chore(make): makefile with build/test/lint/migrate targets"
```

---

## Task 17: Create the Dockerfiles

**Files:**
- Create: `/Users/samuelmauli/dev/PaymentsHub/Dockerfile.api`
- Create: `/Users/samuelmauli/dev/PaymentsHub/Dockerfile.worker`

- [ ] **Step 1: Write `Dockerfile.api`**

Create `/Users/samuelmauli/dev/PaymentsHub/Dockerfile.api`:

```dockerfile
# syntax=docker/dockerfile:1.7
FROM golang:1.22-alpine AS builder
WORKDIR /src

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG VERSION=dev
ARG COMMIT=unknown
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath \
      -ldflags "-s -w -X main.version=${VERSION} -X main.commit=${COMMIT}" \
      -o /out/paymentshub-api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=builder /out/paymentshub-api /app/paymentshub-api
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/paymentshub-api"]
```

- [ ] **Step 2: Write `Dockerfile.worker`**

Create `/Users/samuelmauli/dev/PaymentsHub/Dockerfile.worker`:

```dockerfile
# syntax=docker/dockerfile:1.7
FROM golang:1.22-alpine AS builder
WORKDIR /src

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG VERSION=dev
ARG COMMIT=unknown
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath \
      -ldflags "-s -w -X main.version=${VERSION} -X main.commit=${COMMIT}" \
      -o /out/paymentshub-worker ./cmd/worker

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=builder /out/paymentshub-worker /app/paymentshub-worker
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
USER nonroot:nonroot
ENTRYPOINT ["/app/paymentshub-worker"]
```

- [ ] **Step 3: Build images**

Run:
```bash
make docker-build
```

Expected: both images build successfully, sizes under 25 MB.

- [ ] **Step 4: Commit**

Run:
```bash
git add Dockerfile.api Dockerfile.worker
git commit -m "chore(docker): distroless dockerfiles for api and worker"
```

---

## Task 18: Run the full `make test` + `make lint` smoke check

This task has no new files. It's a gate: everything written so far must pass.

- [ ] **Step 1: `make tidy`**

Run:
```bash
make tidy
```

Expected: `go.mod` / `go.sum` stable, no changes to commit.

- [ ] **Step 2: `make lint`**

Run:
```bash
make lint
```

Expected: exit code 0, no issues.

- [ ] **Step 3: `make unit`**

Run:
```bash
make unit
```

Expected: all unit tests (config, logging, http) pass.

- [ ] **Step 4: `make integration`**

Run:
```bash
make integration
```

Expected: integration tests pass (postgres container spin-up succeeds).

- [ ] **Step 5: `make build`**

Run:
```bash
make build
./bin/paymentshub-api --help || true
```

Expected: binaries built. (`--help` is unrecognized since the binary has no flag parser — that's fine.)

- [ ] **Step 6: Smoke-run the API against local docker postgres**

Run:
```bash
docker compose up -d
make migrate-up
PH_DATABASE_URL="postgres://paymentshub:paymentshub@localhost:5432/paymentshub?sslmode=disable" \
  ./bin/paymentshub-api &
PID=$!
sleep 1
curl -sf http://localhost:8080/healthz
curl -sf http://localhost:8080/readyz
kill $PID
wait $PID 2>/dev/null || true
```

Expected: both curl commands print `{"status":"ok"}` / `{"status":"ready"}`.

- [ ] **Step 7: If all green, tag and commit any residual changes**

Run:
```bash
git status
# If anything is dirty:
git add -A
git diff --cached --quiet || git commit -m "chore: stabilize after foundations smoke test"
git log --oneline | head -20
```

Expected: commit history shows the Task 1–17 commits in order.

---

## Acceptance criteria for this plan

The plan is complete when:

1. `make lint` is green.
2. `make unit` is green with tests for `config`, `logging`, and `http`.
3. `make integration` is green with the `healthz`, `readyz`, and `postgres-spawn` tests.
4. `make build` produces `bin/paymentshub-api` and `bin/paymentshub-worker`.
5. `make docker-build` produces distroless images under ~25 MB each.
6. `make docker-up && make migrate-up` applies the `schema_metadata` migration cleanly.
7. `./bin/paymentshub-api` responds `200 OK` on both `/healthz` and `/readyz`.
8. `./bin/paymentshub-worker` starts, logs `worker starting`, and exits cleanly on `Ctrl+C`.
9. Git history contains one commit per task (17+ commits).
10. No `TODO` / `TBD` / placeholder files remain under `internal/`, `cmd/`, or `db/`.

Once all criteria are met, return to the brainstorming / planning series and write **Plan 02: domain-and-persistence**.

---

## Self-review

- **Spec coverage:** This plan covers §2.5 (stack), §2.6 (hexagonal layout), §10 (Docker/distroless, 2 binaries, graceful shutdown), §4.6 (healthz/readyz), and the first piece of §9 (test infra with testcontainers and golangci-lint strict preset). It does NOT yet touch §3 (domain), §4 (ingress/approval/admin/webhooks), §5 (flows), §6 (reliability patterns), §7 (security), §8 (obs), which are scheduled for Plans 02–10. This is intentional per the scope section.
- **Placeholder scan:** no TBDs or "TODO" or "add error handling" stubs. Every code block is complete and the helpers are referenced consistently.
- **Type consistency:** `config.Config`, `logging.Options`, `httpadapter.RouterDeps`, `ReadinessCheck`, `HealthHandlers.Livez/Readyz`, `testsupport.SpawnAPI`, `testsupport.SpawnPostgres`, `testsupport.HTTPClient` are all defined where used. The `cmd/api/main.go` imports `httpadapter` and `logging` and `config` with the exact names declared in earlier tasks. Module path `github.com/vanlink-ltda/paymentshub` is used consistently throughout.
