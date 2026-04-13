package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
	"github.com/vanlink-ltda/paymentshub/internal/domain/client"
)

type ClientRepository struct {
	pool *pgxpool.Pool
	q    *dbgen.Queries
}

func NewClientRepository(pool *pgxpool.Pool) *ClientRepository {
	return &ClientRepository{pool: pool, q: dbgen.New(pool)}
}

func (r *ClientRepository) Insert(ctx context.Context, c *client.Client) error {
	_, err := r.q.InsertClient(ctx, dbgen.InsertClientParams{
		ID:             uuidToPg(c.ID),
		Name:           c.Name,
		DocumentType:   c.DocumentType,
		DocumentNumber: c.DocumentNumber,
		Active:         c.Active,
		WebhookUrl:     nullText(c.WebhookURL),
		WebhookSecret:  nullText(c.WebhookSecret),
	})
	if err != nil {
		return fmt.Errorf("insert client: %w", err)
	}
	return nil
}

func (r *ClientRepository) Get(ctx context.Context, id uuid.UUID) (*client.Client, error) {
	row, err := r.q.GetClient(ctx, uuidToPg(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return clientFromRow(row), nil
}

func (r *ClientRepository) GetByDocument(ctx context.Context, doc string) (*client.Client, error) {
	row, err := r.q.GetClientByDocument(ctx, doc)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return clientFromRow(row), nil
}

func (r *ClientRepository) List(ctx context.Context) ([]*client.Client, error) {
	rows, err := r.q.ListClients(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]*client.Client, 0, len(rows))
	for _, row := range rows {
		out = append(out, clientFromRow(row))
	}
	return out, nil
}

func (r *ClientRepository) UpdateWebhook(ctx context.Context, id uuid.UUID, url, secret string) error {
	return r.q.UpdateClientWebhook(ctx, dbgen.UpdateClientWebhookParams{
		ID:            uuidToPg(id),
		WebhookUrl:    nullText(url),
		WebhookSecret: nullText(secret),
	})
}

func clientFromRow(row dbgen.Client) *client.Client {
	return &client.Client{
		ID:             pgToUUID(row.ID),
		Name:           row.Name,
		DocumentType:   row.DocumentType,
		DocumentNumber: row.DocumentNumber,
		Active:         row.Active,
		WebhookURL:     row.WebhookUrl.String,
		WebhookSecret:  row.WebhookSecret.String,
		CreatedAt:      row.CreatedAt.Time,
		UpdatedAt:      row.UpdatedAt.Time,
	}
}
