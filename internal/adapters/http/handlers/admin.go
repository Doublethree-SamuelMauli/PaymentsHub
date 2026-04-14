package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/repositories"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/beneficiary"
	"github.com/vanlink-ltda/paymentshub/internal/domain/client"
)

// AdminHandler exposes admin CRUD for payer accounts, beneficiaries, api keys, clients.
type AdminHandler struct {
	payerAccts    ports.PayerAccountRepository
	beneficiaries ports.BeneficiaryRepository
	apiKeys       ports.APIKeyRepository
	clients       *repositories.ClientRepository
	q             *dbgen.Queries
}

func NewAdminHandler(
	payerAccts ports.PayerAccountRepository,
	beneficiaries ports.BeneficiaryRepository,
	apiKeys ports.APIKeyRepository,
	clients *repositories.ClientRepository,
	pool *pgxpool.Pool,
) *AdminHandler {
	return &AdminHandler{
		payerAccts:    payerAccts,
		beneficiaries: beneficiaries,
		apiKeys:       apiKeys,
		clients:       clients,
		q:             dbgen.New(pool),
	}
}

func (h *AdminHandler) Register(r chi.Router) {
	r.Route("/v1/admin", func(r chi.Router) {
		r.Use(mw.RequireScope("admin"))
		r.Get("/payer-accounts", h.ListPayerAccounts)
		r.Get("/beneficiaries", h.ListBeneficiaries)
		r.Post("/clients", h.CreateClient)
		r.Post("/clients/{id}/webhook", h.ConfigureWebhook)
		r.Post("/payer-accounts", h.CreatePayerAccount)
		r.Post("/beneficiaries", h.CreateBeneficiary)
		r.Post("/beneficiaries/{id}/pix-keys", h.AddPixKey)
		r.Post("/beneficiaries/{id}/bank-accounts", h.AddBankAccount)
		r.Post("/api-keys", h.CreateAPIKey)
		r.Post("/clients/{id}/limits", h.SetClientLimits)
		r.Post("/blacklist", h.AddBlacklistEntry)
		r.Post("/clients/{id}/duplicate-rule", h.SetDuplicateRule)
	})
}

type createPayerAcctReq struct {
	BankCode       string `json:"bank_code" validate:"required,len=3"`
	Agency         string `json:"agency" validate:"required"`
	AccountNumber  string `json:"account_number" validate:"required"`
	AccountDigit   string `json:"account_digit" validate:"required"`
	OAuthClientID  string `json:"oauth_client_id" validate:"required"`
	OAuthSecretRef string `json:"oauth_secret_ref" validate:"required"`
	SFTPHost       string `json:"sftp_host"`
	SFTPUser       string `json:"sftp_user"`
	SFTPKeyRef     string `json:"sftp_key_ref"`
	SFTPRemessaDir string `json:"sftp_remessa_dir"`
	SFTPRetornoDir string `json:"sftp_retorno_dir"`
	Label          string `json:"label" validate:"required"`
}

func (h *AdminHandler) CreatePayerAccount(w http.ResponseWriter, r *http.Request) {
	var req createPayerAcctReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	if req.Label == "" || req.BankCode == "" {
		writeJSONError(w, http.StatusBadRequest, "label and bank_code required", nil)
		return
	}
	id := uuid.New()
	if err := h.payerAccts.Insert(r.Context(), ports.PayerAccount{
		ID:             id,
		BankCode:       req.BankCode,
		Agency:         req.Agency,
		AccountNumber:  req.AccountNumber,
		AccountDigit:   req.AccountDigit,
		OAuthClientID:  req.OAuthClientID,
		OAuthSecretRef: req.OAuthSecretRef,
		SFTPHost:       req.SFTPHost,
		SFTPUser:       req.SFTPUser,
		SFTPKeyRef:     req.SFTPKeyRef,
		SFTPRemessaDir: req.SFTPRemessaDir,
		SFTPRetornoDir: req.SFTPRetornoDir,
		Label:          req.Label,
		Active:         true,
	}); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "insert payer account", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"id": id.String(), "label": req.Label})
}

type createBeneficiaryReq struct {
	Kind                 string   `json:"kind" validate:"required,oneof=SUPPLIER CLIENT EMPLOYEE GOVERNMENT OTHER"`
	LegalName            string   `json:"legal_name" validate:"required"`
	TradeName            string   `json:"trade_name"`
	DocumentType         string   `json:"document_type" validate:"required,oneof=CPF CNPJ"`
	DocumentNumber       string   `json:"document_number" validate:"required"`
	Email                string   `json:"email"`
	Phone                string   `json:"phone"`
	Tags                 []string `json:"tags"`
	DefaultPaymentMethod string   `json:"default_payment_method"`
	Notes                string   `json:"notes"`
}

func (h *AdminHandler) CreateBeneficiary(w http.ResponseWriter, r *http.Request) {
	var req createBeneficiaryReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	b := &beneficiary.Beneficiary{
		ID:                   uuid.New(),
		Kind:                 beneficiary.Kind(req.Kind),
		LegalName:            req.LegalName,
		TradeName:            req.TradeName,
		DocumentType:         beneficiary.DocumentType(req.DocumentType),
		DocumentNumber:       req.DocumentNumber,
		Email:                req.Email,
		Phone:                req.Phone,
		Tags:                 req.Tags,
		DefaultPaymentMethod: req.DefaultPaymentMethod,
		Notes:                req.Notes,
		Active:               true,
	}
	if err := h.beneficiaries.Insert(r.Context(), b); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "insert beneficiary", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"id": b.ID.String()})
}

type addPixKeyReq struct {
	KeyType  string `json:"key_type" validate:"required,oneof=CPF CNPJ EMAIL PHONE EVP"`
	KeyValue string `json:"key_value" validate:"required"`
	Label    string `json:"label"`
}

func (h *AdminHandler) AddPixKey(w http.ResponseWriter, r *http.Request) {
	benID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid beneficiary id", nil)
		return
	}
	var req addPixKeyReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	k := &beneficiary.PixKey{
		ID:            uuid.New(),
		BeneficiaryID: benID,
		KeyType:       beneficiary.PixKeyType(req.KeyType),
		KeyValue:      req.KeyValue,
		Label:         req.Label,
		Active:        true,
	}
	if err := h.beneficiaries.InsertPixKey(r.Context(), k); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "insert pix key", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"id": k.ID.String()})
}

type addBankAccountReq struct {
	BankCode      string `json:"bank_code" validate:"required,len=3"`
	Agency        string `json:"agency" validate:"required"`
	AccountNumber string `json:"account_number" validate:"required"`
	AccountDigit  string `json:"account_digit" validate:"required"`
	AccountType   string `json:"account_type" validate:"required,oneof=CC CP PG"`
	Label         string `json:"label"`
}

func (h *AdminHandler) AddBankAccount(w http.ResponseWriter, r *http.Request) {
	benID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid beneficiary id", nil)
		return
	}
	var req addBankAccountReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	a := &beneficiary.BankAccount{
		ID:            uuid.New(),
		BeneficiaryID: benID,
		BankCode:      req.BankCode,
		Agency:        req.Agency,
		AccountNumber: req.AccountNumber,
		AccountDigit:  req.AccountDigit,
		AccountType:   beneficiary.AccountType(req.AccountType),
		Label:         req.Label,
		Active:        true,
	}
	if err := h.beneficiaries.InsertBankAccount(r.Context(), a); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "insert bank account", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"id": a.ID.String()})
}

type createAPIKeyReq struct {
	Label  string   `json:"label" validate:"required"`
	Scopes []string `json:"scopes" validate:"required,min=1"`
}

func (h *AdminHandler) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	var req createAPIKeyReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	if req.Label == "" || len(req.Scopes) == 0 {
		writeJSONError(w, http.StatusBadRequest, "label and scopes required", nil)
		return
	}
	// Generate 32 random bytes -> base64url.
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "rand", nil)
		return
	}
	token := "phk_" + base64.RawURLEncoding.EncodeToString(raw)

	id := uuid.New()
	if err := h.apiKeys.Insert(r.Context(), ports.APIKey{
		ID:      id,
		Label:   req.Label,
		KeyHash: mw.HashToken(token),
		Scopes:  req.Scopes,
		Active:  true,
	}); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "insert api key", map[string]any{"detail": err.Error()})
		return
	}
	// The raw token is returned EXACTLY ONCE.
	writeJSON(w, http.StatusCreated, map[string]any{
		"id":     id.String(),
		"label":  req.Label,
		"token":  token,
		"scopes": req.Scopes,
		"warning": "store this token securely — it will not be shown again",
	})
}

// ----- Clients -----

type createClientReq struct {
	Name           string `json:"name" validate:"required"`
	DocumentType   string `json:"document_type" validate:"required,oneof=CPF CNPJ"`
	DocumentNumber string `json:"document_number" validate:"required"`
	WebhookURL     string `json:"webhook_url"`
}

func (h *AdminHandler) CreateClient(w http.ResponseWriter, r *http.Request) {
	var req createClientReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	if req.Name == "" || req.DocumentNumber == "" {
		writeJSONError(w, http.StatusBadRequest, "name and document_number required", nil)
		return
	}

	// Generate HMAC secret for webhooks
	secretBytes := make([]byte, 32)
	if _, err := rand.Read(secretBytes); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "generate secret", nil)
		return
	}
	webhookSecret := "whsec_" + base64.RawURLEncoding.EncodeToString(secretBytes)

	c := &client.Client{
		ID:             uuid.New(),
		Name:           req.Name,
		DocumentType:   req.DocumentType,
		DocumentNumber: req.DocumentNumber,
		Active:         true,
		WebhookURL:     req.WebhookURL,
		WebhookSecret:  webhookSecret,
	}
	if err := h.clients.Insert(r.Context(), c); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "insert client", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"id":             c.ID.String(),
		"name":           c.Name,
		"webhook_secret": webhookSecret,
		"warning":        "store the webhook_secret securely — it will not be shown again",
	})
}

type configureWebhookReq struct {
	WebhookURL string `json:"webhook_url" validate:"required,url"`
}

func (h *AdminHandler) ConfigureWebhook(w http.ResponseWriter, r *http.Request) {
	clientID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid client id", nil)
		return
	}
	var req configureWebhookReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}

	c, err := h.clients.Get(r.Context(), clientID)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "client not found", nil)
		return
	}

	secret := c.WebhookSecret
	if secret == "" {
		secretBytes := make([]byte, 32)
		_, _ = rand.Read(secretBytes)
		secret = "whsec_" + base64.RawURLEncoding.EncodeToString(secretBytes)
	}

	if err := h.clients.UpdateWebhook(r.Context(), clientID, req.WebhookURL, secret); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "update webhook", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"webhook_url":    req.WebhookURL,
		"webhook_secret": secret,
	})
}

// ----- Limits -----

type setLimitsReq struct {
	DailyLimitCents      int64 `json:"daily_limit_cents"`
	MonthlyLimitCents    int64 `json:"monthly_limit_cents"`
	MaxSingleCents       int64 `json:"max_single_cents"`
	RequireApprovalAbove int64 `json:"require_approval_above"`
}

func (h *AdminHandler) SetClientLimits(w http.ResponseWriter, r *http.Request) {
	clientID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid client id", nil)
		return
	}
	var req setLimitsReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}

	pgID := pgtype.UUID{Bytes: clientID, Valid: true}
	_, err = h.q.GetClientLimit(r.Context(), pgID)
	if err != nil {
		_, err = h.q.InsertClientLimit(r.Context(), dbgen.InsertClientLimitParams{
			ID:                   pgtype.UUID{Bytes: uuid.New(), Valid: true},
			ClientID:             pgID,
			DailyLimitCents:      req.DailyLimitCents,
			MonthlyLimitCents:    req.MonthlyLimitCents,
			MaxSingleCents:       req.MaxSingleCents,
			RequireApprovalAbove: req.RequireApprovalAbove,
		})
	} else {
		err = h.q.UpdateClientLimit(r.Context(), dbgen.UpdateClientLimitParams{
			ClientID:             pgID,
			DailyLimitCents:      req.DailyLimitCents,
			MonthlyLimitCents:    req.MonthlyLimitCents,
			MaxSingleCents:       req.MaxSingleCents,
			RequireApprovalAbove: req.RequireApprovalAbove,
		})
	}
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "set limits", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// ----- Blacklist -----

type addBlacklistReq struct {
	ClientID       string `json:"client_id"`
	DocumentNumber string `json:"document_number" validate:"required"`
	Reason         string `json:"reason" validate:"required"`
}

func (h *AdminHandler) AddBlacklistEntry(w http.ResponseWriter, r *http.Request) {
	var req addBlacklistReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	if req.DocumentNumber == "" || req.Reason == "" {
		writeJSONError(w, http.StatusBadRequest, "document_number and reason required", nil)
		return
	}
	var pgClientID pgtype.UUID
	if req.ClientID != "" {
		cid, err := uuid.Parse(req.ClientID)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid client_id", nil)
			return
		}
		pgClientID = pgtype.UUID{Bytes: cid, Valid: true}
	}
	actor := mw.APIKeyLabelFromContext(r.Context())
	entry, err := h.q.InsertBlacklistEntry(r.Context(), dbgen.InsertBlacklistEntryParams{
		ID:             pgtype.UUID{Bytes: uuid.New(), Valid: true},
		ClientID:       pgClientID,
		DocumentNumber: req.DocumentNumber,
		Reason:         req.Reason,
		CreatedBy:      actor,
	})
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "insert blacklist", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"id": uuid.UUID(entry.ID.Bytes).String()})
}

// ----- Duplicate Rule -----

type setDuplicateRuleReq struct {
	WindowHours int    `json:"window_hours"`
	Action      string `json:"action" validate:"oneof=REVIEW REJECT ALLOW"`
}

func (h *AdminHandler) SetDuplicateRule(w http.ResponseWriter, r *http.Request) {
	clientID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid client id", nil)
		return
	}
	var req setDuplicateRuleReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	if req.WindowHours <= 0 {
		req.WindowHours = 24
	}
	if req.Action == "" {
		req.Action = "REVIEW"
	}
	_, err = h.q.InsertDuplicateRule(r.Context(), dbgen.InsertDuplicateRuleParams{
		ID:          pgtype.UUID{Bytes: uuid.New(), Valid: true},
		ClientID:    pgtype.UUID{Bytes: clientID, Valid: true},
		WindowHours: int32(req.WindowHours),
		MatchFields: []string{"beneficiary_id", "amount_cents"},
		Action:      req.Action,
	})
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "insert rule", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

// ----- List endpoints (for frontend forms) -----

func (h *AdminHandler) ListPayerAccounts(w http.ResponseWriter, r *http.Request) {
	accounts, err := h.payerAccts.List(r.Context())
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "list payer accounts", nil)
		return
	}
	out := make([]map[string]any, 0, len(accounts))
	for _, a := range accounts {
		out = append(out, map[string]any{
			"id":             a.ID.String(),
			"bank_code":      a.BankCode,
			"agency":         a.Agency,
			"account_number": a.AccountNumber,
			"account_digit":  a.AccountDigit,
			"label":          a.Label,
			"active":         a.Active,
		})
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *AdminHandler) ListBeneficiaries(w http.ResponseWriter, r *http.Request) {
	bens, err := h.beneficiaries.List(r.Context(), 200, 0)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "list beneficiaries", nil)
		return
	}
	out := make([]map[string]any, 0, len(bens))
	for _, b := range bens {
		keys, _ := h.beneficiaries.ListPixKeys(r.Context(), b.ID)
		pix := make([]map[string]string, 0, len(keys))
		for _, k := range keys {
			pix = append(pix, map[string]string{"key_type": string(k.KeyType), "key_value": k.KeyValue})
		}
		accounts, _ := h.beneficiaries.ListBankAccounts(r.Context(), b.ID)
		banks := make([]map[string]string, 0, len(accounts))
		for _, a := range accounts {
			banks = append(banks, map[string]string{
				"bank_code": a.BankCode, "agency": a.Agency,
				"account_number": a.AccountNumber, "account_digit": a.AccountDigit,
				"account_type": string(a.AccountType),
			})
		}
		out = append(out, map[string]any{
			"id":              b.ID.String(),
			"kind":            string(b.Kind),
			"legal_name":      b.LegalName,
			"document_type":   string(b.DocumentType),
			"document_number": b.DocumentNumber,
			"active":          b.Active,
			"pix_keys":        pix,
			"bank_accounts":   banks,
		})
	}
	writeJSON(w, http.StatusOK, out)
}

// Silence unused import when embedded helpers shuffle.
var _ = context.Background
