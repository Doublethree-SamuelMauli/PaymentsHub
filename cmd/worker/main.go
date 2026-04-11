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
