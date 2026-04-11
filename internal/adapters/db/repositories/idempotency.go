package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
)

type IdempotencyRepository struct {
	pool *pgxpool.Pool
	q    *dbgen.Queries
}

func NewIdempotencyRepository(pool *pgxpool.Pool) *IdempotencyRepository {
	return &IdempotencyRepository{pool: pool, q: dbgen.New(pool)}
}

var _ ports.IdempotencyRepository = (*IdempotencyRepository)(nil)

func (r *IdempotencyRepository) Insert(ctx context.Context, rec ports.IdempotencyRecord) error {
	snap, err := json.Marshal(rec.ResponseSnapshot)
	if err != nil {
		return fmt.Errorf("marshal snapshot: %w", err)
	}
	_, err = r.q.InsertIdempotencyKey(ctx, dbgen.InsertIdempotencyKeyParams{
		Key:              rec.Key,
		Scope:            rec.Scope,
		RequestHash:      rec.RequestHash,
		ResponseSnapshot: snap,
		StatusCode:       int32(rec.StatusCode),
		ExpiresAt:        pgtype.Timestamptz{Time: rec.ExpiresAt, Valid: true},
	})
	if err != nil {
		return fmt.Errorf("insert idempotency: %w", err)
	}
	return nil
}

func (r *IdempotencyRepository) Get(ctx context.Context, key string) (*ports.IdempotencyRecord, error) {
	row, err := r.q.GetIdempotencyKey(ctx, key)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get idempotency: %w", err)
	}
	rec := &ports.IdempotencyRecord{
		Key:         row.Key,
		Scope:       row.Scope,
		RequestHash: row.RequestHash,
		StatusCode:  int(row.StatusCode),
		CreatedAt:   row.CreatedAt.Time,
		ExpiresAt:   row.ExpiresAt.Time,
	}
	if len(row.ResponseSnapshot) > 0 {
		_ = json.Unmarshal(row.ResponseSnapshot, &rec.ResponseSnapshot)
	}
	return rec, nil
}

func (r *IdempotencyRepository) DeleteExpired(ctx context.Context) error {
	return r.q.DeleteExpiredIdempotencyKeys(ctx)
}
