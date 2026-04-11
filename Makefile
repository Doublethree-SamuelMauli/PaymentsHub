SHELL := /bin/bash

MODULE      := github.com/vanlink-ltda/paymentshub
BIN_DIR     := bin
API_BIN     := $(BIN_DIR)/paymentshub-api
WORKER_BIN  := $(BIN_DIR)/paymentshub-worker

DATABASE_URL ?= postgres://paymentshub:paymentshub@localhost:5434/paymentshub?sslmode=disable

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
