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

type PayerAccountRepository struct {
	pool *pgxpool.Pool
	q    *dbgen.Queries
}

func NewPayerAccountRepository(pool *pgxpool.Pool) *PayerAccountRepository {
	return &PayerAccountRepository{pool: pool, q: dbgen.New(pool)}
}

var _ ports.PayerAccountRepository = (*PayerAccountRepository)(nil)

func (r *PayerAccountRepository) Insert(ctx context.Context, rec ports.PayerAccount) error {
	_, err := r.q.InsertPayerAccount(ctx, dbgen.InsertPayerAccountParams{
		ID:             uuidToPg(rec.ID),
		BankCode:       rec.BankCode,
		Agency:         rec.Agency,
		AccountNumber:  rec.AccountNumber,
		AccountDigit:   rec.AccountDigit,
		CertificateID:  uuidPtrToPg(rec.CertificateID),
		OauthClientID:  rec.OAuthClientID,
		OauthSecretRef: rec.OAuthSecretRef,
		SftpHost:       nullText(rec.SFTPHost),
		SftpUser:       nullText(rec.SFTPUser),
		SftpKeyRef:     nullText(rec.SFTPKeyRef),
		SftpRemessaDir: nullText(rec.SFTPRemessaDir),
		SftpRetornoDir: nullText(rec.SFTPRetornoDir),
		Label:          rec.Label,
		Active:         rec.Active,
	})
	if err != nil {
		return fmt.Errorf("insert payer account: %w", err)
	}
	return nil
}

func (r *PayerAccountRepository) Get(ctx context.Context, id uuid.UUID) (*ports.PayerAccount, error) {
	row, err := r.q.GetPayerAccount(ctx, uuidToPg(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return payerAccountFromRow(row), nil
}

func (r *PayerAccountRepository) GetByLabel(ctx context.Context, label string) (*ports.PayerAccount, error) {
	row, err := r.q.GetPayerAccountByLabel(ctx, label)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return payerAccountFromRow(row), nil
}

func (r *PayerAccountRepository) List(ctx context.Context) ([]*ports.PayerAccount, error) {
	rows, err := r.q.ListPayerAccounts(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]*ports.PayerAccount, 0, len(rows))
	for _, row := range rows {
		out = append(out, payerAccountFromRow(row))
	}
	return out, nil
}

func payerAccountFromRow(row dbgen.PayerAccount) *ports.PayerAccount {
	pa := &ports.PayerAccount{
		ID:             pgToUUID(row.ID),
		BankCode:       row.BankCode,
		Agency:         row.Agency,
		AccountNumber:  row.AccountNumber,
		AccountDigit:   row.AccountDigit,
		OAuthClientID:  row.OauthClientID,
		OAuthSecretRef: row.OauthSecretRef,
		SFTPHost:       row.SftpHost.String,
		SFTPUser:       row.SftpUser.String,
		SFTPKeyRef:     row.SftpKeyRef.String,
		SFTPRemessaDir: row.SftpRemessaDir.String,
		SFTPRetornoDir: row.SftpRetornoDir.String,
		Label:          row.Label,
		Active:         row.Active,
	}
	if row.CertificateID.Valid {
		cid := pgToUUID(row.CertificateID)
		pa.CertificateID = &cid
	}
	return pa
}

// Silence unused import.
var _ = pgtype.Text{}
