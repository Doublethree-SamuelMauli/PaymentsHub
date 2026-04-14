package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/run"
)

type RunRepository struct {
	pool *pgxpool.Pool
	q    *dbgen.Queries
}

func NewRunRepository(pool *pgxpool.Pool) *RunRepository {
	return &RunRepository{pool: pool, q: dbgen.New(pool)}
}

// Pool exposes the underlying pgxpool for advanced transactional use cases
// (e.g., reschedule which updates fields not covered by sqlc queries).
func (r *RunRepository) Pool() *pgxpool.Pool { return r.pool }

func (r *RunRepository) Insert(ctx context.Context, rn *run.Run) error {
	_, err := r.q.InsertPaymentRun(ctx, dbgen.InsertPaymentRunParams{
		ID:      uuidToPg(rn.ID),
		RunDate: pgtype.Date{Time: rn.RunDate, Valid: true},
		Status:  string(rn.Status),
	})
	if err != nil {
		return fmt.Errorf("insert run: %w", err)
	}
	return nil
}

func (r *RunRepository) Get(ctx context.Context, id uuid.UUID) (*run.Run, error) {
	row, err := r.q.GetPaymentRun(ctx, uuidToPg(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return runFromRow(row), nil
}

// UpdateStatus writes status/approved_at/approved_by/closed_at.
func (r *RunRepository) UpdateStatus(ctx context.Context, id uuid.UUID, st run.Status, approvedBy string, approvedAt, closedAt *time.Time) error {
	var appAt pgtype.Timestamptz
	if approvedAt != nil {
		appAt = pgtype.Timestamptz{Time: *approvedAt, Valid: true}
	}
	var closeAt pgtype.Timestamptz
	if closedAt != nil {
		closeAt = pgtype.Timestamptz{Time: *closedAt, Valid: true}
	}
	_, err := r.q.UpdatePaymentRunStatus(ctx, dbgen.UpdatePaymentRunStatusParams{
		ID:         uuidToPg(id),
		Status:     string(st),
		ApprovedAt: appAt,
		ApprovedBy: nullText(approvedBy),
		ClosedAt:   closeAt,
	})
	return err
}

func (r *RunRepository) AttachPayment(ctx context.Context, runID, paymentID uuid.UUID, channel run.Channel) error {
	_, err := r.q.AttachPaymentToRun(ctx, dbgen.AttachPaymentToRunParams{
		RunID:     uuidToPg(runID),
		PaymentID: uuidToPg(paymentID),
		Channel:   string(channel),
	})
	return err
}

func (r *RunRepository) DetachPayment(ctx context.Context, runID, paymentID uuid.UUID) error {
	return r.q.DetachPaymentFromRun(ctx, dbgen.DetachPaymentFromRunParams{
		RunID:     uuidToPg(runID),
		PaymentID: uuidToPg(paymentID),
	})
}

func (r *RunRepository) ListItems(ctx context.Context, runID uuid.UUID) ([]RunItem, error) {
	rows, err := r.q.ListRunItems(ctx, uuidToPg(runID))
	if err != nil {
		return nil, err
	}
	out := make([]RunItem, 0, len(rows))
	for _, row := range rows {
		out = append(out, RunItem{
			RunID:     pgToUUID(row.RunID),
			PaymentID: pgToUUID(row.PaymentID),
			Channel:   run.Channel(row.Channel),
		})
	}
	return out, nil
}

func (r *RunRepository) UpdateCounters(ctx context.Context, runID uuid.UUID, totalItems, pixCount, tedCount int, totalAmount money.Cents) error {
	return r.q.UpdatePaymentRunCounters(ctx, dbgen.UpdatePaymentRunCountersParams{
		ID:               uuidToPg(runID),
		TotalItems:       int32(totalItems),
		TotalAmountCents: totalAmount.Int64(),
		PixCount:         int32(pixCount),
		TedCount:         int32(tedCount),
	})
}

// RunItem is a lightweight DTO for list operations.
type RunItem struct {
	RunID     uuid.UUID
	PaymentID uuid.UUID
	Channel   run.Channel
}

func runFromRow(row dbgen.PaymentRun) *run.Run {
	rn := &run.Run{
		ID:          pgToUUID(row.ID),
		RunDate:     row.RunDate.Time,
		Status:      run.Status(row.Status),
		ApprovedBy:  row.ApprovedBy.String,
		TotalItems:  int(row.TotalItems),
		TotalAmount: money.Cents(row.TotalAmountCents),
		PixCount:    int(row.PixCount),
		TedCount:    int(row.TedCount),
		CreatedAt:   row.CreatedAt.Time,
	}
	if row.ApprovedAt.Valid {
		t := row.ApprovedAt.Time
		rn.ApprovedAt = &t
	}
	if row.ClosedAt.Valid {
		t := row.ClosedAt.Time
		rn.ClosedAt = &t
	}
	if len(row.Summary) > 0 {
		_ = json.Unmarshal(row.Summary, &rn.Summary)
	}
	return rn
}
