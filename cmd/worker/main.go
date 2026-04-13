// Command paymentshub-worker hosts River workers that process payments
// asynchronously: prevalidation, PIX submission, CNAB generation, and
// reconciliation cron jobs.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/itau/rest"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/db"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/repositories"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/queue"
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

	poolCtx, cancelPool := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelPool()
	pool, err := db.NewPool(poolCtx, db.PoolConfig{
		DSN:             cfg.DatabaseURL,
		MaxConns:        10,
		MinConns:        2,
		MaxConnLifetime: 30 * time.Minute,
	})
	if err != nil {
		return fmt.Errorf("open db pool: %w", err)
	}
	defer pool.Close()

	paymentRepo := repositories.NewPaymentRepository(pool)
	eventRepo := repositories.NewPaymentEventRepository(pool)

	gateway := buildGateway(cfg, logger)

	workers := river.NewWorkers()
	river.AddWorker(workers, queue.NewPrevalidatePaymentWorker(paymentRepo, eventRepo, gateway, logger))
	river.AddWorker(workers, queue.NewSubmitPixWorker(paymentRepo, eventRepo, gateway, logger))
	river.AddWorker(workers, queue.NewGenerateCnabWorker(logger))

	riverClient, err := river.NewClient(riverpgxv5.New(pool), &river.Config{
		Queues: map[string]river.QueueConfig{
			river.QueueDefault: {MaxWorkers: 20},
		},
		Workers: workers,
		Logger:  slog.New(logger.Handler()),
	})
	if err != nil {
		return fmt.Errorf("new river client: %w", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := riverClient.Start(ctx); err != nil {
		return fmt.Errorf("start river: %w", err)
	}
	logger.Info("worker started", slog.String("env", cfg.Env))

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	logger.Info("shutdown signal received")
	shutCtx, shutCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutCancel()
	if err := riverClient.Stop(shutCtx); err != nil {
		return fmt.Errorf("stop river: %w", err)
	}

	logger.Info("worker stopped")
	return nil
}

func buildGateway(cfg config.Config, logger *slog.Logger) *rest.Client {
	itauBaseURL := os.Getenv("PH_ITAU_BASE_URL")
	if itauBaseURL == "" {
		itauBaseURL = "https://cdpj-sandbox.partners.uatinter.co"
	}
	itauTokenURL := os.Getenv("PH_ITAU_TOKEN_URL")
	if itauTokenURL == "" {
		itauTokenURL = itauBaseURL + "/oauth/token"
	}

	_ = logger // TODO: structured logging on gateway calls
	return rest.NewClient(rest.Config{
		BaseURL:        itauBaseURL,
		TokenURL:       itauTokenURL,
		OAuthClientID:  os.Getenv("PH_ITAU_CLIENT_ID"),
		OAuthSecret:    os.Getenv("PH_ITAU_CLIENT_SECRET"),
		Scope:          os.Getenv("PH_ITAU_SCOPE"),
		MaxRetries:     5,
		InitialBackoff: 1 * time.Second,
		BreakerName:    "itau-worker",
	})
}

// Suppress lint for pool import.
var _ = (*pgxpool.Pool)(nil)
