// Command seed populates the database with realistic demo data.
// Run: go run ./cmd/seed
package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
)

func main() {
	dsn := os.Getenv("PH_DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://paymentshub:paymentshub@localhost:5434/paymentshub?sslmode=disable"
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	q := dbgen.New(pool)

	// Clean existing demo data
	pool.Exec(ctx, "DELETE FROM payment_run_items")
	pool.Exec(ctx, "DELETE FROM prevalidation_results")
	pool.Exec(ctx, "DELETE FROM cnab_files")
	pool.Exec(ctx, "DELETE FROM webhook_deliveries")
	pool.Exec(ctx, "TRUNCATE payment_events CASCADE")
	pool.Exec(ctx, "DELETE FROM idempotency_keys")
	pool.Exec(ctx, "DELETE FROM payments")
	pool.Exec(ctx, "DELETE FROM payment_runs")
	pool.Exec(ctx, "DELETE FROM beneficiary_pix_keys")
	pool.Exec(ctx, "DELETE FROM beneficiary_bank_accounts")
	pool.Exec(ctx, "DELETE FROM beneficiaries")
	pool.Exec(ctx, "DELETE FROM api_keys")
	pool.Exec(ctx, "DELETE FROM duplicate_rules")
	pool.Exec(ctx, "DELETE FROM blacklist_entries")
	pool.Exec(ctx, "DELETE FROM client_limits")
	pool.Exec(ctx, "DELETE FROM payer_accounts")
	pool.Exec(ctx, "DELETE FROM clients")
	log.Println("Cleaned existing data")

	// Client
	clientID := uid()
	q.InsertClient(ctx, dbgen.InsertClientParams{
		ID: pg(clientID), Name: "Double Three Tecnologia LTDA",
		DocumentType: "CNPJ", DocumentNumber: "12345678000199",
		Active: true, WebhookUrl: nt("https://erp.doublethree.com.br/webhooks/payments"),
		WebhookSecret: nt("whsec_demo_secret_key_2026"),
	})

	// Payer Account
	payerID := uid()
	q.InsertPayerAccount(ctx, dbgen.InsertPayerAccountParams{
		ID: pg(payerID), BankCode: "341", Agency: "1234",
		AccountNumber: "567890", AccountDigit: "0",
		OauthClientID: "itau-oauth-client", OauthSecretRef: "secrets/itau-oauth",
		SftpHost: nt("sftp.itau.com.br"), SftpUser: nt("paymentshub"),
		SftpKeyRef: nt("secrets/itau-sftp-key"),
		SftpRemessaDir: nt("/remessa"), SftpRetornoDir: nt("/retorno"),
		Label: "Itau Conta Principal", Active: true, ClientID: pg(clientID),
	})

	// API Key (admin)
	adminKeyID := uid()
	hash := sha256Hash("admin-demo-token-2026")
	q.InsertApiKey(ctx, dbgen.InsertApiKeyParams{
		ID: pg(adminKeyID), Label: "Admin Portal",
		KeyHash: hash,
		Scopes:  []string{"admin", "payments:write", "payments:read", "runs:write", "runs:approve"},
		Active:  true, ClientID: pg(clientID),
	})

	// Beneficiaries
	bens := []struct {
		id   uuid.UUID
		name string
		doc  string
		kind string
	}{
		{uid(), "ACME Tecnologia LTDA", "11222333000144", "SUPPLIER"},
		{uid(), "Escritorio Silva & Associados", "22333444000155", "SUPPLIER"},
		{uid(), "TechParts Componentes SA", "33444555000166", "SUPPLIER"},
		{uid(), "Maria Souza Costa", "12345678901", "EMPLOYEE"},
		{uid(), "Consultoria Estrategica BR", "44555666000177", "CLIENT"},
	}

	for _, b := range bens {
		docType := "CNPJ"
		if len(b.doc) == 11 {
			docType = "CPF"
		}
		q.InsertBeneficiary(ctx, dbgen.InsertBeneficiaryParams{
			ID: pg(b.id), Kind: b.kind, LegalName: b.name,
			DocumentType: docType, DocumentNumber: b.doc,
			Tags: []string{}, Active: true, ClientID: pg(clientID),
		})

		pixKeyType := "CNPJ"
		if docType == "CPF" {
			pixKeyType = "CPF"
		}
		q.InsertBeneficiaryPixKey(ctx, dbgen.InsertBeneficiaryPixKeyParams{
			ID: pg(uid()), BeneficiaryID: pg(b.id),
			KeyType: pixKeyType, KeyValue: b.doc,
			Label: nt("Principal"), Active: true,
		})
	}

	// Payments - mix realista de status
	type payDef struct {
		extID  string
		typ    string
		status string
		amount int64
		benIdx int
		desc   string
		bankRef string
		days   int
	}

	pays := []payDef{
		{"NF-2026-001", "PIX", "SETTLED", 1500000, 0, "Licenca software anual", "E341202604130001", -5},
		{"NF-2026-002", "PIX", "SETTLED", 350000, 1, "Honorarios advocaticios marco", "E341202604130002", -4},
		{"NF-2026-003", "TED", "SETTLED", 4200000, 2, "Componentes eletronicos lote 47", "", -3},
		{"NF-2026-004", "PIX", "SENT", 89000, 3, "Adiantamento salarial abril", "E341202604130004", -1},
		{"NF-2026-005", "PIX", "APPROVED", 250000, 0, "Manutencao servidores abril", "", 0},
		{"NF-2026-006", "TED", "APPROVED", 780000, 2, "Pecas reposicao Q2", "", 0},
		{"NF-2026-007", "PIX", "PREVALIDATED", 125000, 1, "Consultoria juridica abril", "", 0},
		{"NF-2026-008", "PIX", "PREVALIDATED", 430000, 4, "Projeto estrategia digital", "", 0},
		{"NF-2026-009", "TED", "PREVALIDATED", 1800000, 2, "Componentes lote 48", "", 0},
		{"NF-2026-010", "PIX", "RECEIVED", 67000, 3, "Reembolso viagem", "", 0},
		{"NF-2026-011", "PIX", "RECEIVED", 190000, 0, "Suporte tecnico mensal", "", 0},
		{"NF-2026-012", "PIX", "UNDER_REVIEW", 950000, 4, "Consultoria valor alto", "", -1},
		{"NF-2026-013", "TED", "FAILED", 320000, 1, "Transferencia rejeitada banco", "", -2},
		{"NF-2026-014", "PIX", "CANCELED", 55000, 3, "Pagamento cancelado pelo operador", "", -3},
		{"NF-2026-015", "PIX", "ON_HOLD", 410000, 0, "Aguardando verificacao CNPJ", "", 0},
		{"NF-2026-016", "PIX", "SETTLED", 175000, 3, "Folha complementar marco", "E341202604130016", -7},
		{"NF-2026-017", "TED", "SETTLED", 2100000, 2, "Componentes lote 46", "", -10},
		{"NF-2026-018", "PIX", "SETTLED", 89000, 1, "Honorarios fevereiro", "E341202604130018", -15},
		{"NF-2026-019", "PIX", "VALIDATED_LOCAL", 310000, 4, "Fase 2 projeto digital", "", 0},
		{"NF-2026-020", "TED", "RECEIVED", 560000, 2, "Pecas urgentes", "", 0},
	}

	payIDs := make([]uuid.UUID, len(pays))
	for i, p := range pays {
		payIDs[i] = uid()
		ben := bens[p.benIdx]
		createdAt := time.Now().AddDate(0, 0, p.days)

		payeeMethod := "PIX_KEY"
		payee := []byte(fmt.Sprintf(`{"key_type":"CNPJ","key_value":"%s"}`, ben.doc))
		if p.typ == "TED" {
			payeeMethod = "BANK_ACCOUNT"
			payee = []byte(`{"bank_code":"033","agency":"0001","account_number":"123456","account_digit":"7","account_type":"CC"}`)
		}

		q.InsertPayment(ctx, dbgen.InsertPaymentParams{
			ID: pg(payIDs[i]), ExternalID: nt(p.extID),
			Type: p.typ, Status: p.status,
			AmountCents: p.amount, Currency: "BRL",
			PayerAccountID: pg(payerID), BeneficiaryID: pg(ben.id),
			BeneficiarySnapshot: []byte(fmt.Sprintf(`{"legal_name":"%s","document":"%s"}`, ben.name, ben.doc)),
			PayeeMethod: payeeMethod, Payee: payee,
			Description:    nt(p.desc),
			IdempotencyKey: fmt.Sprintf("seed-%s", payIDs[i].String()[:8]),
			ClientID:       pg(clientID),
		})

		// Bank reference for SENT/SETTLED
		if p.bankRef != "" {
			q.UpdatePaymentStatus(ctx, dbgen.UpdatePaymentStatusParams{
				ID: pg(payIDs[i]), Status: p.status,
				BankReference: nt(p.bankRef),
			})
		}

		// Payment events (audit trail)
		transitions := statusChain(p.status)
		for j, tr := range transitions {
			from := ""
			if j > 0 {
				from = transitions[j-1]
			}
			actor := "SYSTEM"
			reason := "automatic"
			if tr == "APPROVED" {
				actor = "USER:admin"
				reason = "approved via portal"
			}
			if tr == "UNDER_REVIEW" {
				reason = "preanalysis flagged: amount exceeds threshold"
			}
			if tr == "ON_HOLD" {
				actor = "USER:admin"
				reason = "manual hold: aguardando verificacao"
			}
			if tr == "CANCELED" {
				actor = "USER:admin"
				reason = "cancelado pelo operador"
			}
			if tr == "FAILED" {
				actor = "BANK"
				reason = "banco rejeitou: saldo insuficiente"
			}
			q.InsertPaymentEvent(ctx, dbgen.InsertPaymentEventParams{
				ID: pg(uid()), PaymentID: pg(payIDs[i]),
				FromStatus: nt(from), ToStatus: tr,
				Actor: actor, Reason: nt(reason),
				CorrelationID: nt(fmt.Sprintf("seed-%d", i)),
			})
			_ = createdAt
		}
	}

	// Payment Runs
	run1ID := uid()
	q.InsertPaymentRun(ctx, dbgen.InsertPaymentRunParams{
		ID: pg(run1ID), RunDate: pgDate(time.Now().AddDate(0, 0, -5)),
		Status: "CLOSED", ClientID: pg(clientID),
	})
	now := time.Now()
	q.UpdatePaymentRunStatus(ctx, dbgen.UpdatePaymentRunStatusParams{
		ID: pg(run1ID), Status: "CLOSED",
		ApprovedAt: pgTs(now.AddDate(0, 0, -5)), ApprovedBy: nt("admin"),
		ClosedAt: pgTs(now.AddDate(0, 0, -4)),
	})
	q.UpdatePaymentRunCounters(ctx, dbgen.UpdatePaymentRunCountersParams{
		ID: pg(run1ID), TotalItems: 3, TotalAmountCents: 6050000,
		PixCount: 2, TedCount: 1,
	})

	run2ID := uid()
	q.InsertPaymentRun(ctx, dbgen.InsertPaymentRunParams{
		ID: pg(run2ID), RunDate: pgDate(time.Now()),
		Status: "OPEN", ClientID: pg(clientID),
	})

	log.Println("Seed complete!")
	log.Printf("  Client: %s", clientID)
	log.Printf("  Payer Account: %s", payerID)
	log.Printf("  API Key: admin-demo-token-2026")
	log.Printf("  Beneficiaries: %d", len(bens))
	log.Printf("  Payments: %d", len(pays))
	log.Printf("  Runs: 2 (1 closed, 1 open)")
}

func uid() uuid.UUID              { return uuid.New() }
func pg(id uuid.UUID) pgtype.UUID { return pgtype.UUID{Bytes: id, Valid: true} }
func nt(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}
func pgDate(t time.Time) pgtype.Date         { return pgtype.Date{Time: t, Valid: true} }
func pgTs(t time.Time) pgtype.Timestamptz    { return pgtype.Timestamptz{Time: t, Valid: true} }

func sha256Hash(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}

func statusChain(target string) []string {
	chains := map[string][]string{
		"RECEIVED":        {"RECEIVED"},
		"VALIDATED_LOCAL": {"RECEIVED", "VALIDATED_LOCAL"},
		"PREVALIDATED":    {"RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED"},
		"APPROVED":        {"RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "APPROVED"},
		"SUBMITTING":      {"RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "APPROVED", "SUBMITTING"},
		"SENT":            {"RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "APPROVED", "SUBMITTING", "SENT"},
		"SETTLED":         {"RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "APPROVED", "SUBMITTING", "SENT", "SETTLED"},
		"FAILED":          {"RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "APPROVED", "SUBMITTING", "SENT", "FAILED"},
		"REJECTED":        {"RECEIVED", "REJECTED"},
		"CANCELED":        {"RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "CANCELED"},
		"ON_HOLD":         {"RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "APPROVED", "ON_HOLD"},
		"UNDER_REVIEW":    {"RECEIVED", "VALIDATED_LOCAL", "UNDER_REVIEW"},
	}
	if c, ok := chains[target]; ok {
		return c
	}
	return []string{target}
}
