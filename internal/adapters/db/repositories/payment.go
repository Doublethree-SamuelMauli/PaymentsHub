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
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

// PaymentRepository implements ports.PaymentRepository backed by pgxpool+sqlc.
type PaymentRepository struct {
	pool *pgxpool.Pool
	q    *dbgen.Queries
}

// NewPaymentRepository builds a new repository bound to the given pool.
func NewPaymentRepository(pool *pgxpool.Pool) *PaymentRepository {
	return &PaymentRepository{pool: pool, q: dbgen.New(pool)}
}

var _ ports.PaymentRepository = (*PaymentRepository)(nil)

func (r *PaymentRepository) Insert(ctx context.Context, p *payment.Payment) error {
	benSnap, err := json.Marshal(p.BeneficiarySnapshot)
	if err != nil {
		return fmt.Errorf("marshal snapshot: %w", err)
	}
	payeeJSON, err := json.Marshal(p.Payee)
	if err != nil {
		return fmt.Errorf("marshal payee: %w", err)
	}

	args := dbgen.InsertPaymentParams{
		ID:                  uuidToPg(p.ID),
		ExternalID:          nullText(p.ExternalID),
		Type:                string(p.Type),
		Status:              string(p.Status),
		AmountCents:         p.Amount.Int64(),
		Currency:            p.Currency,
		PayerAccountID:      uuidToPg(p.PayerAccountID),
		BeneficiaryID:       uuidPtrToPg(p.BeneficiaryID),
		BeneficiarySnapshot: benSnap,
		PayeeMethod:         string(p.PayeeMethod),
		Payee:               payeeJSON,
		Description:         nullText(p.Description),
		ScheduledFor:        nullDate(p.ScheduledFor),
		IdempotencyKey:      p.IdempotencyKey,
		ClientID:            uuidPtrToPg(p.ClientID),
	}

	row, err := r.q.InsertPayment(ctx, args)
	if err != nil {
		return fmt.Errorf("insert payment: %w", err)
	}
	p.CreatedAt = row.CreatedAt.Time
	p.UpdatedAt = row.UpdatedAt.Time
	return nil
}

func (r *PaymentRepository) Get(ctx context.Context, id uuid.UUID) (*payment.Payment, error) {
	row, err := r.q.GetPayment(ctx, uuidToPg(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get payment: %w", err)
	}
	return paymentFromRow(row), nil
}

func (r *PaymentRepository) GetByIdempotencyKey(ctx context.Context, key string) (*payment.Payment, error) {
	row, err := r.q.GetPaymentByIdempotencyKey(ctx, key)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("get payment by idem: %w", err)
	}
	return paymentFromRow(row), nil
}

func (r *PaymentRepository) UpdateStatus(ctx context.Context, id uuid.UUID, to payment.Status, bankRef, rejectReason string) error {
	_, err := r.q.UpdatePaymentStatus(ctx, dbgen.UpdatePaymentStatusParams{
		ID:              uuidToPg(id),
		Status:          string(to),
		BankReference:   nullText(bankRef),
		RejectionReason: nullText(rejectReason),
	})
	if err != nil {
		return fmt.Errorf("update status: %w", err)
	}
	return nil
}

func (r *PaymentRepository) ListByStatus(ctx context.Context, status payment.Status, limit, offset int) ([]*payment.Payment, error) {
	rows, err := r.q.ListPaymentsByStatus(ctx, dbgen.ListPaymentsByStatusParams{
		Status: string(status),
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, fmt.Errorf("list by status: %w", err)
	}
	out := make([]*payment.Payment, 0, len(rows))
	for _, row := range rows {
		out = append(out, paymentFromRow(row))
	}
	return out, nil
}

func (r *PaymentRepository) ListAll(ctx context.Context, limit, offset int) ([]*payment.Payment, error) {
	rows, err := r.q.ListAllPayments(ctx, dbgen.ListAllPaymentsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, fmt.Errorf("list all: %w", err)
	}
	out := make([]*payment.Payment, 0, len(rows))
	for _, row := range rows {
		out = append(out, paymentFromRow(row))
	}
	return out, nil
}

func paymentFromRow(row dbgen.Payment) *payment.Payment {
	p := &payment.Payment{
		ID:             pgToUUID(row.ID),
		ExternalID:     row.ExternalID.String,
		Type:           payment.Type(row.Type),
		Status:         payment.Status(row.Status),
		Amount:         money.Cents(row.AmountCents),
		Currency:       row.Currency,
		PayerAccountID: pgToUUID(row.PayerAccountID),
		PayeeMethod:    payment.PayeeMethod(row.PayeeMethod),
		Description:    row.Description.String,
		IdempotencyKey: row.IdempotencyKey,
		BankReference:  row.BankReference.String,
		RejectionReason: row.RejectionReason.String,
		CreatedAt:      row.CreatedAt.Time,
		UpdatedAt:      row.UpdatedAt.Time,
	}
	if row.BeneficiaryID.Valid {
		bid := pgToUUID(row.BeneficiaryID)
		p.BeneficiaryID = &bid
	}
	if row.ClientID.Valid {
		cid := pgToUUID(row.ClientID)
		p.ClientID = &cid
	}
	if len(row.BeneficiarySnapshot) > 0 {
		_ = json.Unmarshal(row.BeneficiarySnapshot, &p.BeneficiarySnapshot)
	}
	if len(row.Payee) > 0 {
		_ = json.Unmarshal(row.Payee, &p.Payee)
	}
	if row.ScheduledFor.Valid {
		t := row.ScheduledFor.Time
		p.ScheduledFor = &t
	}
	return p
}

func uuidToPg(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

func uuidPtrToPg(id *uuid.UUID) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: *id, Valid: true}
}

func pgToUUID(id pgtype.UUID) uuid.UUID {
	if !id.Valid {
		return uuid.Nil
	}
	return uuid.UUID(id.Bytes)
}

func nullText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}

func nullDate(t *time.Time) pgtype.Date {
	if t == nil {
		return pgtype.Date{}
	}
	return pgtype.Date{Time: *t, Valid: true}
}
