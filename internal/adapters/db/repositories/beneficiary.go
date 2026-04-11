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
	"github.com/vanlink-ltda/paymentshub/internal/domain/beneficiary"
)

type BeneficiaryRepository struct {
	pool *pgxpool.Pool
	q    *dbgen.Queries
}

func NewBeneficiaryRepository(pool *pgxpool.Pool) *BeneficiaryRepository {
	return &BeneficiaryRepository{pool: pool, q: dbgen.New(pool)}
}

var _ ports.BeneficiaryRepository = (*BeneficiaryRepository)(nil)

func (r *BeneficiaryRepository) Insert(ctx context.Context, b *beneficiary.Beneficiary) error {
	_, err := r.q.InsertBeneficiary(ctx, dbgen.InsertBeneficiaryParams{
		ID:                   uuidToPg(b.ID),
		Kind:                 string(b.Kind),
		LegalName:            b.LegalName,
		TradeName:            nullText(b.TradeName),
		DocumentType:         string(b.DocumentType),
		DocumentNumber:       b.DocumentNumber,
		Email:                nullText(b.Email),
		Phone:                nullText(b.Phone),
		Tags:                 b.Tags,
		DefaultPaymentMethod: nullText(b.DefaultPaymentMethod),
		Notes:                nullText(b.Notes),
		Active:               b.Active,
	})
	if err != nil {
		return fmt.Errorf("insert beneficiary: %w", err)
	}
	return nil
}

func (r *BeneficiaryRepository) Get(ctx context.Context, id uuid.UUID) (*beneficiary.Beneficiary, error) {
	row, err := r.q.GetBeneficiary(ctx, uuidToPg(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return benFromRow(row), nil
}

func (r *BeneficiaryRepository) GetByDocument(ctx context.Context, doc string) (*beneficiary.Beneficiary, error) {
	row, err := r.q.GetBeneficiaryByDocument(ctx, doc)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return benFromRow(row), nil
}

func (r *BeneficiaryRepository) List(ctx context.Context, limit, offset int) ([]*beneficiary.Beneficiary, error) {
	rows, err := r.q.ListBeneficiaries(ctx, dbgen.ListBeneficiariesParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, err
	}
	out := make([]*beneficiary.Beneficiary, 0, len(rows))
	for _, row := range rows {
		out = append(out, benFromRow(row))
	}
	return out, nil
}

func (r *BeneficiaryRepository) InsertPixKey(ctx context.Context, k *beneficiary.PixKey) error {
	var verified pgtype.Timestamptz
	if k.VerifiedAt != nil {
		verified = pgtype.Timestamptz{Time: *k.VerifiedAt, Valid: true}
	}
	_, err := r.q.InsertBeneficiaryPixKey(ctx, dbgen.InsertBeneficiaryPixKeyParams{
		ID:            uuidToPg(k.ID),
		BeneficiaryID: uuidToPg(k.BeneficiaryID),
		KeyType:       string(k.KeyType),
		KeyValue:      k.KeyValue,
		Label:         nullText(k.Label),
		Active:        k.Active,
		VerifiedAt:    verified,
	})
	return err
}

func (r *BeneficiaryRepository) ListPixKeys(ctx context.Context, beneficiaryID uuid.UUID) ([]*beneficiary.PixKey, error) {
	rows, err := r.q.ListBeneficiaryPixKeys(ctx, uuidToPg(beneficiaryID))
	if err != nil {
		return nil, err
	}
	out := make([]*beneficiary.PixKey, 0, len(rows))
	for _, row := range rows {
		k := &beneficiary.PixKey{
			ID:            pgToUUID(row.ID),
			BeneficiaryID: pgToUUID(row.BeneficiaryID),
			KeyType:       beneficiary.PixKeyType(row.KeyType),
			KeyValue:      row.KeyValue,
			Label:         row.Label.String,
			Active:        row.Active,
			CreatedAt:     row.CreatedAt.Time,
		}
		if row.VerifiedAt.Valid {
			t := row.VerifiedAt.Time
			k.VerifiedAt = &t
		}
		out = append(out, k)
	}
	return out, nil
}

func (r *BeneficiaryRepository) InsertBankAccount(ctx context.Context, a *beneficiary.BankAccount) error {
	var verified pgtype.Timestamptz
	if a.VerifiedAt != nil {
		verified = pgtype.Timestamptz{Time: *a.VerifiedAt, Valid: true}
	}
	_, err := r.q.InsertBeneficiaryBankAccount(ctx, dbgen.InsertBeneficiaryBankAccountParams{
		ID:            uuidToPg(a.ID),
		BeneficiaryID: uuidToPg(a.BeneficiaryID),
		BankCode:      a.BankCode,
		Agency:        a.Agency,
		AccountNumber: a.AccountNumber,
		AccountDigit:  a.AccountDigit,
		AccountType:   string(a.AccountType),
		Label:         nullText(a.Label),
		Active:        a.Active,
		VerifiedAt:    verified,
	})
	return err
}

func (r *BeneficiaryRepository) ListBankAccounts(ctx context.Context, beneficiaryID uuid.UUID) ([]*beneficiary.BankAccount, error) {
	rows, err := r.q.ListBeneficiaryBankAccounts(ctx, uuidToPg(beneficiaryID))
	if err != nil {
		return nil, err
	}
	out := make([]*beneficiary.BankAccount, 0, len(rows))
	for _, row := range rows {
		a := &beneficiary.BankAccount{
			ID:            pgToUUID(row.ID),
			BeneficiaryID: pgToUUID(row.BeneficiaryID),
			BankCode:      row.BankCode,
			Agency:        row.Agency,
			AccountNumber: row.AccountNumber,
			AccountDigit:  row.AccountDigit,
			AccountType:   beneficiary.AccountType(row.AccountType),
			Label:         row.Label.String,
			Active:        row.Active,
			CreatedAt:     row.CreatedAt.Time,
		}
		if row.VerifiedAt.Valid {
			t := row.VerifiedAt.Time
			a.VerifiedAt = &t
		}
		out = append(out, a)
	}
	return out, nil
}

func benFromRow(row dbgen.Beneficiary) *beneficiary.Beneficiary {
	return &beneficiary.Beneficiary{
		ID:                   pgToUUID(row.ID),
		Kind:                 beneficiary.Kind(row.Kind),
		LegalName:            row.LegalName,
		TradeName:            row.TradeName.String,
		DocumentType:         beneficiary.DocumentType(row.DocumentType),
		DocumentNumber:       row.DocumentNumber,
		Email:                row.Email.String,
		Phone:                row.Phone.String,
		Tags:                 row.Tags,
		DefaultPaymentMethod: row.DefaultPaymentMethod.String,
		Notes:                row.Notes.String,
		Active:               row.Active,
		CreatedAt:            row.CreatedAt.Time,
		UpdatedAt:            row.UpdatedAt.Time,
	}
}
