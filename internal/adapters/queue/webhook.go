package queue

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
)

// DeliverWebhookArgs is enqueued whenever a payment status changes and the
// owning client has a webhook_url configured.
type DeliverWebhookArgs struct {
	DeliveryID string `json:"delivery_id"`
}

func (DeliverWebhookArgs) Kind() string { return "deliver_webhook" }

type DeliverWebhookWorker struct {
	river.WorkerDefaults[DeliverWebhookArgs]
	pool   *pgxpool.Pool
	q      *dbgen.Queries
	client *http.Client
	logger *slog.Logger
}

func NewDeliverWebhookWorker(pool *pgxpool.Pool, logger *slog.Logger) *DeliverWebhookWorker {
	return &DeliverWebhookWorker{
		pool:   pool,
		q:      dbgen.New(pool),
		client: &http.Client{Timeout: 10 * time.Second},
		logger: logger,
	}
}

func (w *DeliverWebhookWorker) Work(ctx context.Context, job *river.Job[DeliverWebhookArgs]) error {
	deliveryID, err := uuid.Parse(job.Args.DeliveryID)
	if err != nil {
		return fmt.Errorf("parse delivery_id: %w", err)
	}

	delivery, err := w.q.GetWebhookDelivery(ctx, uuidToPg(deliveryID))
	if err != nil {
		return fmt.Errorf("load delivery: %w", err)
	}

	client, err := w.q.GetClient(ctx, delivery.ClientID)
	if err != nil {
		return fmt.Errorf("load client: %w", err)
	}

	if !client.WebhookUrl.Valid || client.WebhookUrl.String == "" {
		w.logger.Info("webhook: client has no URL, marking failed",
			slog.String("delivery_id", deliveryID.String()))
		_ = w.q.UpdateWebhookDeliveryStatus(ctx, dbgen.UpdateWebhookDeliveryStatusParams{
			ID:             uuidToPg(deliveryID),
			Status:         "FAILED",
			ResponseStatus: pgtype.Int4{Int32: 0, Valid: false},
			ResponseBody:   pgtype.Text{String: "no webhook_url configured", Valid: true},
		})
		return nil
	}

	payloadBytes, _ := json.Marshal(json.RawMessage(delivery.Payload))
	signature := signPayload(payloadBytes, client.WebhookSecret.String)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, client.WebhookUrl.String, bytes.NewReader(payloadBytes))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-PaymentsHub-Signature", signature)
	req.Header.Set("X-PaymentsHub-Delivery-ID", deliveryID.String())

	resp, err := w.client.Do(req)
	if err != nil {
		w.logger.Warn("webhook: delivery failed",
			slog.String("delivery_id", deliveryID.String()),
			slog.Any("err", err))
		return err // River will retry
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))

	status := "DELIVERED"
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		status = "PENDING" // will be retried
		w.logger.Warn("webhook: non-2xx response",
			slog.String("delivery_id", deliveryID.String()),
			slog.Int("status", resp.StatusCode))
		_ = w.q.UpdateWebhookDeliveryStatus(ctx, dbgen.UpdateWebhookDeliveryStatusParams{
			ID:             uuidToPg(deliveryID),
			Status:         status,
			ResponseStatus: pgtype.Int4{Int32: int32(resp.StatusCode), Valid: true},
			ResponseBody:   pgtype.Text{String: string(body), Valid: true},
		})
		return fmt.Errorf("non-2xx: %d", resp.StatusCode)
	}

	_ = w.q.UpdateWebhookDeliveryStatus(ctx, dbgen.UpdateWebhookDeliveryStatusParams{
		ID:             uuidToPg(deliveryID),
		Status:         status,
		ResponseStatus: pgtype.Int4{Int32: int32(resp.StatusCode), Valid: true},
		ResponseBody:   pgtype.Text{String: string(body), Valid: true},
	})

	w.logger.Info("webhook: delivered",
		slog.String("delivery_id", deliveryID.String()),
		slog.Int("status", resp.StatusCode))
	return nil
}

func signPayload(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}

func uuidToPg(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}
