// Command paymentshub-api is the HTTP ingress binary.
//
// It wires configuration, logger, Postgres pool, and the chi router, then
// serves HTTP until SIGTERM/SIGINT, at which point it drains in-flight
// requests within the configured shutdown timeout and closes the pool.
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

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/repositories"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks"
	httpadapter "github.com/vanlink-ltda/paymentshub/internal/adapters/http"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/http/handlers"
	"github.com/vanlink-ltda/paymentshub/internal/app"
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

	poolCtx, cancelPool := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelPool()
	pool, err := db.NewPool(poolCtx, db.PoolConfig{
		DSN:             cfg.DatabaseURL,
		MaxConns:        20,
		MinConns:        2,
		MaxConnLifetime: 30 * time.Minute,
		MaxConnIdleTime: 5 * time.Minute,
	})
	if err != nil {
		return fmt.Errorf("open db pool: %w", err)
	}
	defer pool.Close()

	// Repositories
	paymentRepo := repositories.NewPaymentRepository(pool)
	eventRepo := repositories.NewPaymentEventRepository(pool)
	idemRepo := repositories.NewIdempotencyRepository(pool)
	apiKeyRepo := repositories.NewAPIKeyRepository(pool)
	payerAcctRepo := repositories.NewPayerAccountRepository(pool)
	beneficiaryRepo := repositories.NewBeneficiaryRepository(pool)
	clientRepo := repositories.NewClientRepository(pool)
	runRepo := repositories.NewRunRepository(pool)

	// Application services
	receivePayment := app.NewReceivePayment(paymentRepo, eventRepo, idemRepo, payerAcctRepo)
	runService := app.NewRunService(runRepo, paymentRepo, eventRepo)

	// HTTP handlers
	paymentsHandler := handlers.NewPaymentsHandler(receivePayment, paymentRepo, eventRepo)
	runsHandler := handlers.NewRunsHandler(runService, pool)
	adminHandler := handlers.NewAdminHandler(payerAcctRepo, beneficiaryRepo, apiKeyRepo, clientRepo, pool)
	webhookHandler := handlers.NewWebhookHandler(paymentRepo, eventRepo, logger)
	authHandler := handlers.NewAuthHandler(pool)
	usersHandler := handlers.NewUsersHandler(pool)
	settingsHandler := handlers.NewSettingsHandler(pool, banks.AllValidators())

	jwtSecret := []byte(os.Getenv("PH_JWT_SECRET"))
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("paymentshub-dev-secret-change-in-production")
	}

	router := httpadapter.NewRouter(httpadapter.RouterDeps{
		Logger:          logger,
		ReadinessChecks: []httpadapter.ReadinessCheck{dbReadinessCheck(pool)},
		RequestTimeout:  30 * time.Second,
		APIKeys:         apiKeyRepo,
		Payments:        paymentsHandler,
		Runs:            runsHandler,
		Admin:           adminHandler,
		Webhooks:        webhookHandler,
		Auth:            authHandler,
		Users:           usersHandler,
		Settings:        settingsHandler,
		JWTSecret:       jwtSecret,
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

// dbReadinessCheck runs SELECT 1 against the pool with a short timeout.
func dbReadinessCheck(pool *pgxpool.Pool) httpadapter.ReadinessCheck {
	return func(r *http.Request) error {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		return pool.Ping(ctx)
	}
}
