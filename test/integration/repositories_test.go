//go:build integration

package integration_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/repositories"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/beneficiary"
	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
	"github.com/vanlink-ltda/paymentshub/internal/testsupport"
)

func seedPayerAccount(t *testing.T, repo *repositories.PayerAccountRepository) uuid.UUID {
	t.Helper()
	id := uuid.New()
	err := repo.Insert(context.Background(), ports.PayerAccount{
		ID:             id,
		BankCode:       "341",
		Agency:         "1234",
		AccountNumber:  "56789",
		AccountDigit:   "0",
		OAuthClientID:  "client-id",
		OAuthSecretRef: "secret-ref",
		Label:          "itau-main-" + id.String()[:8],
		Active:         true,
	})
	require.NoError(t, err)
	return id
}

func TestIntegration_PaymentRepo_CreateAndFetch(t *testing.T) {
	dsn := testsupport.SpawnPostgres(t)
	pool := testsupport.OpenPool(t, dsn)

	paRepo := repositories.NewPayerAccountRepository(pool)
	payerID := seedPayerAccount(t, paRepo)

	repo := repositories.NewPaymentRepository(pool)
	p := payment.New(
		uuid.New(),
		"NF-1234",
		payment.TypePIX,
		money.Cents(15000),
		payerID,
		payment.PayeeMethodPIXKey,
		map[string]any{"key_type": "CNPJ", "key_value": "12345678000190"},
		"idem-key-1",
	)
	p.BeneficiarySnapshot = map[string]any{"legal_name": "Fornecedor X"}

	ctx := context.Background()
	require.NoError(t, repo.Insert(ctx, p))
	require.NotZero(t, p.CreatedAt)

	loaded, err := repo.Get(ctx, p.ID)
	require.NoError(t, err)
	require.Equal(t, p.ID, loaded.ID)
	require.Equal(t, payment.StatusReceived, loaded.Status)
	require.Equal(t, money.Cents(15000), loaded.Amount)
	require.Equal(t, "12345678000190", loaded.Payee["key_value"])

	viaIdem, err := repo.GetByIdempotencyKey(ctx, "idem-key-1")
	require.NoError(t, err)
	require.Equal(t, p.ID, viaIdem.ID)

	require.NoError(t, repo.UpdateStatus(ctx, p.ID, payment.StatusValidatedLocal, "", ""))
	after, err := repo.Get(ctx, p.ID)
	require.NoError(t, err)
	require.Equal(t, payment.StatusValidatedLocal, after.Status)

	list, err := repo.ListByStatus(ctx, payment.StatusValidatedLocal, 10, 0)
	require.NoError(t, err)
	require.Len(t, list, 1)
}

func TestIntegration_PaymentEventRepo_AppendOnly(t *testing.T) {
	dsn := testsupport.SpawnPostgres(t)
	pool := testsupport.OpenPool(t, dsn)

	paRepo := repositories.NewPayerAccountRepository(pool)
	payerID := seedPayerAccount(t, paRepo)

	payRepo := repositories.NewPaymentRepository(pool)
	evRepo := repositories.NewPaymentEventRepository(pool)

	ctx := context.Background()
	p := payment.New(uuid.New(), "ext", payment.TypeTED, money.Cents(1000), payerID,
		payment.PayeeMethodBankAccount, map[string]any{"agency": "0001"}, "idem-2")
	p.BeneficiarySnapshot = map[string]any{}
	require.NoError(t, payRepo.Insert(ctx, p))

	require.NoError(t, evRepo.Insert(ctx, ports.PaymentEvent{
		PaymentID: p.ID,
		ToStatus:  "RECEIVED",
		Actor:     "SYSTEM",
	}))
	require.NoError(t, evRepo.Insert(ctx, ports.PaymentEvent{
		PaymentID:  p.ID,
		FromStatus: "RECEIVED",
		ToStatus:   "VALIDATED_LOCAL",
		Actor:      "SYSTEM",
		Reason:     "schema ok",
	}))

	events, err := evRepo.ListForPayment(ctx, p.ID)
	require.NoError(t, err)
	require.Len(t, events, 2)
	require.Equal(t, "RECEIVED", events[0].ToStatus)
	require.Equal(t, "VALIDATED_LOCAL", events[1].ToStatus)
	require.Equal(t, "schema ok", events[1].Reason)

	// Trigger should refuse updates and deletes.
	_, err = pool.Exec(ctx, `UPDATE payment_events SET to_status='HACK' WHERE payment_id=$1`, p.ID)
	require.Error(t, err)
	require.Contains(t, err.Error(), "append-only")

	_, err = pool.Exec(ctx, `DELETE FROM payment_events WHERE payment_id=$1`, p.ID)
	require.Error(t, err)
	require.Contains(t, err.Error(), "append-only")
}

func TestIntegration_IdempotencyRepo(t *testing.T) {
	dsn := testsupport.SpawnPostgres(t)
	pool := testsupport.OpenPool(t, dsn)
	repo := repositories.NewIdempotencyRepository(pool)
	ctx := context.Background()

	err := repo.Insert(ctx, ports.IdempotencyRecord{
		Key:              "unique-key-1",
		Scope:            "POST /v1/payments",
		RequestHash:      "hash-abc",
		ResponseSnapshot: map[string]any{"id": "abc"},
		StatusCode:       201,
		ExpiresAt:        time.Now().Add(24 * time.Hour),
	})
	require.NoError(t, err)

	rec, err := repo.Get(ctx, "unique-key-1")
	require.NoError(t, err)
	require.Equal(t, "hash-abc", rec.RequestHash)
	require.Equal(t, 201, rec.StatusCode)
	require.Equal(t, "abc", rec.ResponseSnapshot["id"])
}

func TestIntegration_APIKeyRepo(t *testing.T) {
	dsn := testsupport.SpawnPostgres(t)
	pool := testsupport.OpenPool(t, dsn)
	repo := repositories.NewAPIKeyRepository(pool)
	ctx := context.Background()

	id := uuid.New()
	require.NoError(t, repo.Insert(ctx, ports.APIKey{
		ID:      id,
		Label:   "test-key",
		KeyHash: "sha256-hash-deadbeef",
		Scopes:  []string{"payments:write", "admin"},
		Active:  true,
	}))

	k, err := repo.GetByHash(ctx, "sha256-hash-deadbeef")
	require.NoError(t, err)
	require.Equal(t, id, k.ID)
	require.Contains(t, k.Scopes, "admin")

	require.NoError(t, repo.Touch(ctx, id))
	require.NoError(t, repo.Revoke(ctx, id))
	_, err = repo.GetByHash(ctx, "sha256-hash-deadbeef")
	require.Error(t, err) // revoked keys are hidden by WHERE active
}

func TestIntegration_BeneficiaryRepo(t *testing.T) {
	dsn := testsupport.SpawnPostgres(t)
	pool := testsupport.OpenPool(t, dsn)
	repo := repositories.NewBeneficiaryRepository(pool)
	ctx := context.Background()

	b := &beneficiary.Beneficiary{
		ID:             uuid.New(),
		Kind:           beneficiary.KindSupplier,
		LegalName:      "Fornecedor XYZ LTDA",
		DocumentType:   beneficiary.DocumentCNPJ,
		DocumentNumber: "12345678000199",
		Tags:           []string{"fornecedor", "ti"},
		Active:         true,
	}
	require.NoError(t, repo.Insert(ctx, b))

	k := &beneficiary.PixKey{
		ID:            uuid.New(),
		BeneficiaryID: b.ID,
		KeyType:       beneficiary.PixKeyCNPJ,
		KeyValue:      "12345678000199",
		Label:         "principal",
		Active:        true,
	}
	require.NoError(t, repo.InsertPixKey(ctx, k))

	keys, err := repo.ListPixKeys(ctx, b.ID)
	require.NoError(t, err)
	require.Len(t, keys, 1)
	require.Equal(t, "12345678000199", keys[0].KeyValue)

	loaded, err := repo.GetByDocument(ctx, "12345678000199")
	require.NoError(t, err)
	require.Equal(t, b.ID, loaded.ID)
}
