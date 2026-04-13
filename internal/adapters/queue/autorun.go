package queue

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/riverqueue/river"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/repositories"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
	"github.com/vanlink-ltda/paymentshub/internal/domain/run"
)

// AutoGroupRunArgs is a periodic job that finds PREVALIDATED payments not yet
// attached to any run and groups them into today's run (creating one if needed).
type AutoGroupRunArgs struct{}

func (AutoGroupRunArgs) Kind() string { return "auto_group_run" }

type AutoGroupRunWorker struct {
	river.WorkerDefaults[AutoGroupRunArgs]
	runs     *repositories.RunRepository
	payments ports.PaymentRepository
	logger   *slog.Logger
}

func NewAutoGroupRunWorker(
	runs *repositories.RunRepository,
	payments ports.PaymentRepository,
	logger *slog.Logger,
) *AutoGroupRunWorker {
	return &AutoGroupRunWorker{runs: runs, payments: payments, logger: logger}
}

func (w *AutoGroupRunWorker) Work(ctx context.Context, _ *river.Job[AutoGroupRunArgs]) error {
	prevalidated, err := w.payments.ListByStatus(ctx, payment.StatusPrevalidated, 1000, 0)
	if err != nil {
		return fmt.Errorf("list prevalidated: %w", err)
	}

	if len(prevalidated) == 0 {
		return nil
	}

	today := time.Now()
	r := run.New(uuid.New(), today)
	if err := w.runs.Insert(ctx, r); err != nil {
		return fmt.Errorf("create run: %w", err)
	}

	attached := 0
	for _, p := range prevalidated {
		channel := run.ChannelPIXRest
		if p.Type == payment.TypeTED {
			channel = run.ChannelCNABTed
		}
		if err := w.runs.AttachPayment(ctx, r.ID, p.ID, channel); err != nil {
			w.logger.Warn("auto-group: attach failed",
				slog.String("payment_id", p.ID.String()),
				slog.Any("err", err))
			continue
		}
		attached++
	}

	w.logger.Info("auto-group: run created",
		slog.String("run_id", r.ID.String()),
		slog.String("run_date", today.Format("2006-01-02")),
		slog.Int("attached", attached))

	return nil
}
