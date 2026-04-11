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

## Environment variables

All variables are prefixed with `PH_`. See `.env.example` for the canonical list.

- `PH_ENV` — environment label (`dev`, `staging`, `prod`)
- `PH_LOG_LEVEL` — `debug` | `info` | `warn` | `error` (default `info`)
- `PH_HTTP_ADDR` — listen address for the API binary (default `:8080`)
- `PH_DATABASE_URL` — Postgres DSN (required)
- `PH_SHUTDOWN_TIMEOUT_SECONDS` — graceful shutdown deadline (default `30`)
