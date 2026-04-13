package queue

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/riverqueue/river"

	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

// ReconcilePixArgs is a periodic job that polls Itaú for the status of all
// payments stuck in SENT for too long. River's periodic job feature schedules
// this every 2 minutes.
type ReconcilePixArgs struct{}

func (ReconcilePixArgs) Kind() string { return "reconcile_pix" }

type ReconcilePixWorker struct {
	river.WorkerDefaults[ReconcilePixArgs]
	payments ports.PaymentRepository
	events   ports.PaymentEventRepository
	gateway  ports.PaymentGateway
	logger   *slog.Logger
}

func NewReconcilePixWorker(
	payments ports.PaymentRepository,
	events ports.PaymentEventRepository,
	gateway ports.PaymentGateway,
	logger *slog.Logger,
) *ReconcilePixWorker {
	return &ReconcilePixWorker{
		payments: payments,
		events:   events,
		gateway:  gateway,
		logger:   logger,
	}
}

func (w *ReconcilePixWorker) Work(ctx context.Context, _ *river.Job[ReconcilePixArgs]) error {
	sentPayments, err := w.payments.ListByStatus(ctx, payment.StatusSent, 500, 0)
	if err != nil {
		return fmt.Errorf("list sent payments: %w", err)
	}

	if len(sentPayments) == 0 {
		return nil
	}

	w.logger.Info("reconcile: checking sent payments", slog.Int("count", len(sentPayments)))

	for _, p := range sentPayments {
		if p.Type != payment.TypePIX || p.BankReference == "" {
			continue
		}

		result, err := w.gateway.GetPixStatus(ctx, p.BankReference)
		if err != nil {
			w.logger.Warn("reconcile: get status failed",
				slog.String("payment_id", p.ID.String()),
				slog.Any("err", err),
			)
			continue
		}

		if result.Status == p.Status {
			continue
		}

		if err := payment.Transition(p.Status, result.Status); err != nil {
			w.logger.Warn("reconcile: illegal transition",
				slog.String("payment_id", p.ID.String()),
				slog.String("from", string(p.Status)),
				slog.String("to", string(result.Status)),
			)
			continue
		}

		if err := w.payments.UpdateStatus(ctx, p.ID, result.Status, result.BankReference, result.Reason); err != nil {
			w.logger.Error("reconcile: update status",
				slog.String("payment_id", p.ID.String()),
				slog.Any("err", err),
			)
			continue
		}

		_ = w.events.Insert(ctx, ports.PaymentEvent{
			ID:         uuid.New(),
			PaymentID:  p.ID,
			FromStatus: string(p.Status),
			ToStatus:   string(result.Status),
			Actor:      "SYSTEM",
			Reason:     "reconciliation poll",
		})

		w.logger.Info("reconcile: payment updated",
			slog.String("payment_id", p.ID.String()),
			slog.String("new_status", string(result.Status)),
		)
	}

	return nil
}
