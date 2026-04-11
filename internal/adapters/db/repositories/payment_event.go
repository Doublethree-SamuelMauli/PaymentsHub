package repositories

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
)

type PaymentEventRepository struct {
	pool *pgxpool.Pool
	q    *dbgen.Queries
}

func NewPaymentEventRepository(pool *pgxpool.Pool) *PaymentEventRepository {
	return &PaymentEventRepository{pool: pool, q: dbgen.New(pool)}
}

var _ ports.PaymentEventRepository = (*PaymentEventRepository)(nil)

func (r *PaymentEventRepository) Insert(ctx context.Context, evt ports.PaymentEvent) error {
	var payload []byte
	if evt.Payload != nil {
		p, err := json.Marshal(evt.Payload)
		if err != nil {
			return fmt.Errorf("marshal payload: %w", err)
		}
		payload = p
	}
	if evt.ID == uuid.Nil {
		evt.ID = uuid.New()
	}
	_, err := r.q.InsertPaymentEvent(ctx, dbgen.InsertPaymentEventParams{
		ID:            uuidToPg(evt.ID),
		PaymentID:     uuidToPg(evt.PaymentID),
		FromStatus:    nullText(evt.FromStatus),
		ToStatus:      evt.ToStatus,
		Actor:         evt.Actor,
		Reason:        nullText(evt.Reason),
		Payload:       payload,
		CorrelationID: nullText(evt.CorrelationID),
	})
	if err != nil {
		return fmt.Errorf("insert payment event: %w", err)
	}
	return nil
}

func (r *PaymentEventRepository) ListForPayment(ctx context.Context, paymentID uuid.UUID) ([]ports.PaymentEvent, error) {
	rows, err := r.q.ListPaymentEventsForPayment(ctx, uuidToPg(paymentID))
	if err != nil {
		return nil, fmt.Errorf("list events: %w", err)
	}
	out := make([]ports.PaymentEvent, 0, len(rows))
	for _, row := range rows {
		e := ports.PaymentEvent{
			ID:            pgToUUID(row.ID),
			PaymentID:     pgToUUID(row.PaymentID),
			FromStatus:    row.FromStatus.String,
			ToStatus:      row.ToStatus,
			Actor:         row.Actor,
			Reason:        row.Reason.String,
			CorrelationID: row.CorrelationID.String,
			At:            row.At.Time,
		}
		if len(row.Payload) > 0 {
			_ = json.Unmarshal(row.Payload, &e.Payload)
		}
		out = append(out, e)
	}
	return out, nil
}

// Silence unused-type warnings for pgtype in this file.
var _ pgtype.Text
