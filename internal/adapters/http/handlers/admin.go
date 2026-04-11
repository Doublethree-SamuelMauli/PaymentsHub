package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/beneficiary"
)

// AdminHandler exposes admin CRUD for payer accounts, beneficiaries, api keys.
type AdminHandler struct {
	payerAccts    ports.PayerAccountRepository
	beneficiaries ports.BeneficiaryRepository
	apiKeys       ports.APIKeyRepository
}

func NewAdminHandler(
	payerAccts ports.PayerAccountRepository,
	beneficiaries ports.BeneficiaryRepository,
	apiKeys ports.APIKeyRepository,
) *AdminHandler {
	return &AdminHandler{
		payerAccts:    payerAccts,
		beneficiaries: beneficiaries,
		apiKeys:       apiKeys,
	}
}

func (h *AdminHandler) Register(r chi.Router) {
	r.Route("/v1/admin", func(r chi.Router) {
		r.Use(mw.RequireScope("admin"))
		r.Post("/payer-accounts", h.CreatePayerAccount)
		r.Post("/beneficiaries", h.CreateBeneficiary)
		r.Post("/beneficiaries/{id}/pix-keys", h.AddPixKey)
		r.Post("/beneficiaries/{id}/bank-accounts", h.AddBankAccount)
		r.Post("/api-keys", h.CreateAPIKey)
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

// Silence unused import when embedded helpers shuffle.
var _ = context.Background
