package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
)

type APIKeyRepository struct {
	pool *pgxpool.Pool
	q    *dbgen.Queries
}

func NewAPIKeyRepository(pool *pgxpool.Pool) *APIKeyRepository {
	return &APIKeyRepository{pool: pool, q: dbgen.New(pool)}
}

var _ ports.APIKeyRepository = (*APIKeyRepository)(nil)

func (r *APIKeyRepository) Insert(ctx context.Context, rec ports.APIKey) error {
	var expiresAt pgtype.Timestamptz
	if rec.ExpiresAt != nil {
		expiresAt = pgtype.Timestamptz{Time: *rec.ExpiresAt, Valid: true}
	}
	_, err := r.q.InsertApiKey(ctx, dbgen.InsertApiKeyParams{
		ID:        uuidToPg(rec.ID),
		Label:     rec.Label,
		KeyHash:   rec.KeyHash,
		Scopes:    rec.Scopes,
		Active:    rec.Active,
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return fmt.Errorf("insert api key: %w", err)
	}
	return nil
}

func (r *APIKeyRepository) GetByHash(ctx context.Context, hash string) (*ports.APIKey, error) {
	row, err := r.q.GetApiKeyByHash(ctx, hash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get api key: %w", err)
	}
	k := &ports.APIKey{
		ID:        pgToUUID(row.ID),
		Label:     row.Label,
		KeyHash:   row.KeyHash,
		Scopes:    row.Scopes,
		Active:    row.Active,
		CreatedAt: row.CreatedAt.Time,
	}
	if row.LastUsedAt.Valid {
		t := row.LastUsedAt.Time
		k.LastUsedAt = &t
	}
	if row.ExpiresAt.Valid {
		t := row.ExpiresAt.Time
		k.ExpiresAt = &t
	}
	return k, nil
}

func (r *APIKeyRepository) Revoke(ctx context.Context, id uuid.UUID) error {
	return r.q.RevokeApiKey(ctx, uuidToPg(id))
}

func (r *APIKeyRepository) Touch(ctx context.Context, id uuid.UUID) error {
	return r.q.TouchApiKey(ctx, uuidToPg(id))
}
