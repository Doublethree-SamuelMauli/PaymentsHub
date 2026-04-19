package payment_test

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/domain/money"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

func makePIX(amount int64, keyType, key string) *payment.Payment {
	return &payment.Payment{
		ID:             uuid.New(),
		Type:           payment.TypePIX,
		Status:         payment.StatusReceived,
		Amount:         money.Cents(amount),
		Currency:       "BRL",
		PayerAccountID: uuid.New(),
		PayeeMethod:    payment.PayeeMethodPIXKey,
		Payee:          map[string]any{"key_type": keyType, "key_value": key},
		IdempotencyKey: "k",
	}
}

func makeTED(amount int64) *payment.Payment {
	return &payment.Payment{
		ID:             uuid.New(),
		Type:           payment.TypeTED,
		Status:         payment.StatusReceived,
		Amount:         money.Cents(amount),
		Currency:       "BRL",
		PayerAccountID: uuid.New(),
		PayeeMethod:    payment.PayeeMethodBankAccount,
		Payee: map[string]any{
			"bank_code":       "033",
			"agency":          "1234",
			"account":         "567890",
			"document_number": "12345678000195",
		},
		IdempotencyKey: "k",
	}
}

func TestValidatePayment_PIXHappy(t *testing.T) {
	p := makePIX(15000, "CNPJ", "12345678000195")
	require.NoError(t, payment.ValidatePayment(p, payment.Limits{}, time.Date(2026, 4, 18, 10, 0, 0, 0, time.UTC)))
}

func TestValidatePayment_BadCPF(t *testing.T) {
	p := makePIX(15000, "CPF", "11111111111")
	err := payment.ValidatePayment(p, payment.Limits{}, time.Now())
	require.Error(t, err)
	require.True(t, errors.Is(err, payment.ErrValidation))
}

func TestValidatePayment_ValidCPF(t *testing.T) {
	// 11144477735 is a classic valid CPF used in docs
	p := makePIX(15000, "CPF", "11144477735")
	require.NoError(t, payment.ValidatePayment(p, payment.Limits{}, time.Now()))
}

func TestValidatePayment_Email(t *testing.T) {
	p := makePIX(15000, "EMAIL", "joao@exemplo.com.br")
	require.NoError(t, payment.ValidatePayment(p, payment.Limits{}, time.Now()))

	bad := makePIX(15000, "EMAIL", "not-an-email")
	require.Error(t, payment.ValidatePayment(bad, payment.Limits{}, time.Now()))
}

func TestValidatePayment_Phone(t *testing.T) {
	p := makePIX(15000, "PHONE", "+5511987654321")
	require.NoError(t, payment.ValidatePayment(p, payment.Limits{}, time.Now()))
}

func TestValidatePayment_EVP(t *testing.T) {
	p := makePIX(15000, "EVP", "123e4567-e89b-12d3-a456-426614174000")
	require.NoError(t, payment.ValidatePayment(p, payment.Limits{}, time.Now()))
}

func TestValidatePayment_LimitSingleExceeded(t *testing.T) {
	p := makePIX(200000, "CNPJ", "12345678000195")
	err := payment.ValidatePayment(p, payment.Limits{MaxSingleCents: 100000}, time.Now())
	require.Error(t, err)
	require.True(t, errors.Is(err, payment.ErrPolicy))
}

func TestValidatePayment_TEDAfterCutoff(t *testing.T) {
	p := makeTED(10000)
	afterCutoff := time.Date(2026, 4, 18, 18, 0, 0, 0, time.UTC)
	err := payment.ValidatePayment(p, payment.Limits{TEDHourlyCutoff: 17}, afterCutoff)
	require.Error(t, err)
	require.True(t, errors.Is(err, payment.ErrPolicy))

	// Scheduled TED is OK after cutoff
	next := afterCutoff.Add(24 * time.Hour)
	p.ScheduledFor = &next
	require.NoError(t, payment.ValidatePayment(p, payment.Limits{TEDHourlyCutoff: 17}, afterCutoff))
}

func TestValidatePayment_PIXNightlyCap(t *testing.T) {
	p := makePIX(200000, "CNPJ", "12345678000195")
	night := time.Date(2026, 4, 18, 22, 0, 0, 0, time.UTC)
	err := payment.ValidatePayment(p, payment.Limits{PIXDailyCap: 100000}, night)
	require.Error(t, err)
	require.True(t, errors.Is(err, payment.ErrPolicy))
}

func TestValidatePayment_SchedulePast(t *testing.T) {
	p := makePIX(10000, "CNPJ", "12345678000195")
	past := time.Now().Add(-48 * time.Hour)
	p.ScheduledFor = &past
	err := payment.ValidatePayment(p, payment.Limits{}, time.Now())
	require.Error(t, err)
}

func TestValidateBatch_Aggregates(t *testing.T) {
	items := []*payment.Payment{
		makePIX(50000, "CNPJ", "12345678000195"),
		makePIX(50000, "CNPJ", "12345678000195"),
		makePIX(50000, "CNPJ", "12345678000195"),
	}
	err := payment.ValidateBatch(items, payment.Limits{BatchLimitCents: 100000}, time.Now())
	require.Error(t, err)
	require.True(t, errors.Is(err, payment.ErrPolicy))
}

func TestValidateBatch_MaxItems(t *testing.T) {
	items := make([]*payment.Payment, 5)
	for i := range items {
		items[i] = makePIX(1000, "CNPJ", "12345678000195")
	}
	err := payment.ValidateBatch(items, payment.Limits{BatchMaxItems: 3}, time.Now())
	require.Error(t, err)
	require.True(t, errors.Is(err, payment.ErrPolicy))
}

func TestValidateDocumentNumber(t *testing.T) {
	require.NoError(t, payment.ValidateDocumentNumber("111.444.777-35"))
	require.NoError(t, payment.ValidateDocumentNumber("19.131.243/0001-97"))
	require.Error(t, payment.ValidateDocumentNumber("12345"))
	require.Error(t, payment.ValidateDocumentNumber("11111111111"))
}
