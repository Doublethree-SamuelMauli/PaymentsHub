// Package queue defines River job types and workers for PaymentsHub.
//
// Each job struct is a River "job args" type: it carries the minimal payload
// a worker needs, serialized as JSON into river_job. The Worker struct does the
// real work, depending on application services / ports.
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

// ----- PrevalidatePayment -----

type PrevalidatePaymentArgs struct {
	PaymentID string `json:"payment_id"`
}

func (PrevalidatePaymentArgs) Kind() string { return "prevalidate_payment" }

type PrevalidatePaymentWorker struct {
	river.WorkerDefaults[PrevalidatePaymentArgs]
	payments ports.PaymentRepository
	events   ports.PaymentEventRepository
	gateway  ports.PaymentGateway
	logger   *slog.Logger
}

func NewPrevalidatePaymentWorker(
	payments ports.PaymentRepository,
	events ports.PaymentEventRepository,
	gateway ports.PaymentGateway,
	logger *slog.Logger,
) *PrevalidatePaymentWorker {
	return &PrevalidatePaymentWorker{
		payments: payments,
		events:   events,
		gateway:  gateway,
		logger:   logger,
	}
}

func (w *PrevalidatePaymentWorker) Work(ctx context.Context, job *river.Job[PrevalidatePaymentArgs]) error {
	pid, err := uuid.Parse(job.Args.PaymentID)
	if err != nil {
		return fmt.Errorf("parse payment_id: %w", err)
	}

	p, err := w.payments.Get(ctx, pid)
	if err != nil {
		return fmt.Errorf("load payment: %w", err)
	}

	// Transition RECEIVED → VALIDATED_LOCAL
	if p.Status == payment.StatusReceived {
		if err := w.payments.UpdateStatus(ctx, pid, payment.StatusValidatedLocal, "", ""); err != nil {
			return fmt.Errorf("transition to validated_local: %w", err)
		}
		_ = w.events.Insert(ctx, ports.PaymentEvent{
			PaymentID:  pid,
			FromStatus: string(payment.StatusReceived),
			ToStatus:   string(payment.StatusValidatedLocal),
			Actor:      "SYSTEM",
			Reason:     "schema validated",
		})
		p.Status = payment.StatusValidatedLocal
	}

	// Pre-validate via bank gateway (PIX only for now)
	if p.Type == payment.TypePIX && p.PayeeMethod == payment.PayeeMethodPIXKey {
		keyValue, _ := p.Payee["key_value"].(string)
		keyType, _ := p.Payee["key_type"].(string)
		result, err := w.gateway.PrevalidatePix(ctx, ports.PrevalidatePixRequest{
			KeyType:  keyType,
			KeyValue: keyValue,
		})
		if err != nil {
			w.logger.Warn("prevalidation failed, will retry", slog.String("payment_id", pid.String()), slog.Any("err", err))
			return err // River will retry
		}
		if result.Verdict == "REJECT" {
			_ = w.payments.UpdateStatus(ctx, pid, payment.StatusRejected, "", result.Reason)
			_ = w.events.Insert(ctx, ports.PaymentEvent{
				PaymentID:  pid,
				FromStatus: string(payment.StatusValidatedLocal),
				ToStatus:   string(payment.StatusRejected),
				Actor:      "SYSTEM",
				Reason:     "prevalidation rejected: " + result.Reason,
			})
			return nil
		}
	}

	// Transition VALIDATED_LOCAL → PREVALIDATED
	if err := w.payments.UpdateStatus(ctx, pid, payment.StatusPrevalidated, "", ""); err != nil {
		return fmt.Errorf("transition to prevalidated: %w", err)
	}
	_ = w.events.Insert(ctx, ports.PaymentEvent{
		PaymentID:  pid,
		FromStatus: string(payment.StatusValidatedLocal),
		ToStatus:   string(payment.StatusPrevalidated),
		Actor:      "SYSTEM",
		Reason:     "prevalidation ok",
	})

	w.logger.Info("payment prevalidated", slog.String("payment_id", pid.String()))
	return nil
}

// ----- SubmitPix -----

type SubmitPixArgs struct {
	PaymentID string `json:"payment_id"`
}

func (SubmitPixArgs) Kind() string { return "submit_pix" }

type SubmitPixWorker struct {
	river.WorkerDefaults[SubmitPixArgs]
	payments ports.PaymentRepository
	events   ports.PaymentEventRepository
	gateway  ports.PaymentGateway
	logger   *slog.Logger
}

func NewSubmitPixWorker(
	payments ports.PaymentRepository,
	events ports.PaymentEventRepository,
	gateway ports.PaymentGateway,
	logger *slog.Logger,
) *SubmitPixWorker {
	return &SubmitPixWorker{payments: payments, events: events, gateway: gateway, logger: logger}
}

func (w *SubmitPixWorker) Work(ctx context.Context, job *river.Job[SubmitPixArgs]) error {
	pid, err := uuid.Parse(job.Args.PaymentID)
	if err != nil {
		return fmt.Errorf("parse payment_id: %w", err)
	}

	p, err := w.payments.Get(ctx, pid)
	if err != nil {
		return fmt.Errorf("load payment: %w", err)
	}

	// Transition APPROVED → SUBMITTING
	if p.Status == payment.StatusApproved {
		if err := w.payments.UpdateStatus(ctx, pid, payment.StatusSubmitting, "", ""); err != nil {
			return err
		}
		_ = w.events.Insert(ctx, ports.PaymentEvent{
			PaymentID:  pid,
			FromStatus: string(payment.StatusApproved),
			ToStatus:   string(payment.StatusSubmitting),
			Actor:      "SYSTEM",
		})
		p.Status = payment.StatusSubmitting
	}

	keyValue, _ := p.Payee["key_value"].(string)
	result, err := w.gateway.SendPix(ctx, ports.SendPixRequest{
		IdempotencyKey: p.IdempotencyKey,
		Amount:         p.Amount,
		Description:    p.Description,
		PayeeKeyType:   "",
		PayeeKeyValue:  keyValue,
	})
	if err != nil {
		w.logger.Warn("submit pix failed, will retry", slog.String("payment_id", pid.String()), slog.Any("err", err))
		return err // River retry
	}

	// Transition SUBMITTING → SENT (or SETTLED if bank says so)
	targetStatus := payment.StatusSent
	if result.Status == payment.StatusSettled {
		targetStatus = payment.StatusSettled
	}
	if err := w.payments.UpdateStatus(ctx, pid, targetStatus, result.BankReference, ""); err != nil {
		return err
	}
	_ = w.events.Insert(ctx, ports.PaymentEvent{
		PaymentID:  pid,
		FromStatus: string(payment.StatusSubmitting),
		ToStatus:   string(targetStatus),
		Actor:      "SYSTEM",
		Reason:     "bank_ref=" + result.BankReference,
	})

	w.logger.Info("pix submitted", slog.String("payment_id", pid.String()),
		slog.String("bank_ref", result.BankReference), slog.String("status", string(targetStatus)))
	return nil
}

// ----- GenerateCnab -----

type GenerateCnabArgs struct {
	RunID string `json:"run_id"`
}

func (GenerateCnabArgs) Kind() string { return "generate_cnab" }

// GenerateCnabWorker is a placeholder that Plan 08 wires but the real
// implementation (encoding the file + uploading) is composed from the cnab
// encoder (Plan 06) + SFTP adapter (Plan 07). The work function is left
// as a stub here and completed in Plan 09/10 once all adapters are integrated.
type GenerateCnabWorker struct {
	river.WorkerDefaults[GenerateCnabArgs]
	logger *slog.Logger
}

func NewGenerateCnabWorker(logger *slog.Logger) *GenerateCnabWorker {
	return &GenerateCnabWorker{logger: logger}
}

func (w *GenerateCnabWorker) Work(ctx context.Context, job *river.Job[GenerateCnabArgs]) error {
	w.logger.Info("generate cnab job (stub)", slog.String("run_id", job.Args.RunID))
	// TODO(plan-09): encode CNAB file from run items, upload via SFTP, update cnab_files
	return nil
}
