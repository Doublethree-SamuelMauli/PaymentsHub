package handlers

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
)

// BankValidator tests connectivity for a bank using its credentials.
type BankValidator interface {
	BankCode() string
	Validate(ctx context.Context, creds BankCredentials) error
}

// BankCredentials is the decrypted credential payload.
type BankCredentials struct {
	ClientID     string `json:"client_id,omitempty"`
	ClientSecret string `json:"client_secret,omitempty"`
	APIKey       string `json:"api_key,omitempty"`
	CertPEM      []byte `json:"-"`
	KeyPEM       []byte `json:"-"`
	SFTPHost     string `json:"sftp_host,omitempty"`
	SFTPUser     string `json:"sftp_user,omitempty"`
	SFTPKeyPEM   []byte `json:"-"`
	SFTPRemessa  string `json:"sftp_remessa_dir,omitempty"`
	SFTPRetorno  string `json:"sftp_retorno_dir,omitempty"`
}

// SettingsHandler manages tenant configuration: branding + bank connections.
type SettingsHandler struct {
	q          *dbgen.Queries
	pool       *pgxpool.Pool
	validators map[string]BankValidator
	encKey     []byte // 32 bytes AES-256
}

func NewSettingsHandler(pool *pgxpool.Pool, validators []BankValidator) *SettingsHandler {
	vmap := make(map[string]BankValidator, len(validators))
	for _, v := range validators {
		vmap[v.BankCode()] = v
	}

	key := []byte(os.Getenv("PH_ENCRYPTION_KEY"))
	if len(key) == 0 {
		key = []byte("paymentshub-dev-key-32bytes!!!!") // 31 chars, pad
		key = append(key, '!')                          // 32
	}
	if len(key) < 32 {
		padded := make([]byte, 32)
		copy(padded, key)
		key = padded
	}

	return &SettingsHandler{
		q:          dbgen.New(pool),
		pool:       pool,
		validators: vmap,
		encKey:     key[:32],
	}
}

func (h *SettingsHandler) Register(r chi.Router) {
	r.Route("/v1/settings", func(r chi.Router) {
		// Branding
		r.Get("/branding", h.GetBranding)
		r.Patch("/branding", h.UpdateBranding)

		// Bank connections
		r.Get("/bank-connections", h.ListBankConnections)
		r.Post("/bank-connections", h.CreateBankConnection)
		r.Get("/bank-connections/{id}", h.GetBankConnection)
		r.Patch("/bank-connections/{id}", h.UpdateBankConnection)
		r.Post("/bank-connections/{id}/validate", h.ValidateBankConnection)
		r.Delete("/bank-connections/{id}", h.DeleteBankConnection)

		// Onboarding
		r.Post("/onboarding/complete", h.CompleteOnboarding)
	})
}

// ─── Branding ───

type brandingResponse struct {
	Slug         string `json:"slug"`
	LogoURL      string `json:"logo_url"`
	PrimaryColor string `json:"primary_color"`
	AccentColor  string `json:"accent_color"`
	Onboarding   bool   `json:"onboarding_completed"`
}

func (h *SettingsHandler) GetBranding(w http.ResponseWriter, r *http.Request) {
	tid := mw.TenantFromContext(r.Context())
	c, err := h.q.GetClient(r.Context(), settPgUUID(tid))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "client_not_found"})
		return
	}
	writeJSON(w, http.StatusOK, brandingResponse{
		Slug:         c.Slug.String,
		LogoURL:      c.LogoUrl.String,
		PrimaryColor: c.BrandPrimaryColor,
		AccentColor:  c.BrandAccentColor,
		Onboarding:   c.OnboardingCompleted,
	})
}

type updateBrandingReq struct {
	Slug         string `json:"slug"`
	LogoURL      string `json:"logo_url"`
	PrimaryColor string `json:"primary_color"`
	AccentColor  string `json:"accent_color"`
}

func (h *SettingsHandler) UpdateBranding(w http.ResponseWriter, r *http.Request) {
	var req updateBrandingReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_body"})
		return
	}
	tid := mw.TenantFromContext(r.Context())
	err := h.q.UpdateClientBranding(r.Context(), dbgen.UpdateClientBrandingParams{
		ID:                settPgUUID(tid),
		Slug:              pgtype.Text{String: req.Slug, Valid: req.Slug != ""},
		LogoUrl:           pgtype.Text{String: req.LogoURL, Valid: req.LogoURL != ""},
		BrandPrimaryColor: condStr(req.PrimaryColor != "", req.PrimaryColor, "#143573"),
		BrandAccentColor:  condStr(req.AccentColor != "", req.AccentColor, "#1e4ea8"),
	})
	if err != nil {
		slog.Error("update branding", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "update_failed"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// ─── Bank Connections ───

type bankConnectionResponse struct {
	ID                  string  `json:"id"`
	BankCode            string  `json:"bank_code"`
	BankName            string  `json:"bank_name"`
	AuthMethod          string  `json:"auth_method"`
	HasCredentials      bool    `json:"has_credentials"`
	HasCertificate      bool    `json:"has_certificate"`
	HasSFTP             bool    `json:"has_sftp"`
	Status              string  `json:"status"`
	ValidationAttempts  int     `json:"validation_attempts"`
	LastValidationError *string `json:"last_validation_error,omitempty"`
	CreatedAt           string  `json:"created_at"`
}

func toBankConnectionResp(bc dbgen.BankConnection) bankConnectionResponse {
	var lastErr *string
	if bc.LastValidationError.Valid {
		lastErr = &bc.LastValidationError.String
	}
	return bankConnectionResponse{
		ID:                  settUUIDStr(bc.ID),
		BankCode:            bc.BankCode,
		BankName:            bc.BankName,
		AuthMethod:          bc.AuthMethod,
		HasCredentials:      len(bc.CredentialsEnc) > 0,
		HasCertificate:      len(bc.CertificateEnc) > 0,
		HasSFTP:             bc.SftpHost.Valid && bc.SftpHost.String != "",
		Status:              bc.Status,
		ValidationAttempts:  int(bc.ValidationAttempts),
		LastValidationError: lastErr,
		CreatedAt:           bc.CreatedAt.Time.Format("2006-01-02T15:04:05Z"),
	}
}

func (h *SettingsHandler) ListBankConnections(w http.ResponseWriter, r *http.Request) {
	tid := mw.TenantFromContext(r.Context())
	list, err := h.q.ListBankConnections(r.Context(), settPgUUID(tid))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "list_failed"})
		return
	}
	out := make([]bankConnectionResponse, len(list))
	for i, bc := range list {
		out[i] = toBankConnectionResp(bc)
	}
	writeJSON(w, http.StatusOK, out)
}

type createBankConnectionReq struct {
	BankCode     string          `json:"bank_code"`
	BankName     string          `json:"bank_name"`
	AuthMethod   string          `json:"auth_method"`
	Credentials  json.RawMessage `json:"credentials"`  // {client_id, client_secret, api_key}
	CertPEM      string          `json:"cert_pem"`      // base64 or raw PEM
	KeyPEM       string          `json:"key_pem"`       // base64 or raw PEM
	SFTPHost     string          `json:"sftp_host"`
	SFTPUser     string          `json:"sftp_user"`
	SFTPKeyPEM   string          `json:"sftp_key_pem"`
	SFTPRemessa  string          `json:"sftp_remessa_dir"`
	SFTPRetorno  string          `json:"sftp_retorno_dir"`
}

func (h *SettingsHandler) CreateBankConnection(w http.ResponseWriter, r *http.Request) {
	var req createBankConnectionReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_body"})
		return
	}
	if req.BankCode == "" || req.BankName == "" || req.AuthMethod == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bank_code, bank_name, auth_method required"})
		return
	}

	tid := mw.TenantFromContext(r.Context())
	id := uuid.New()
	nonce, credsEnc, certEnc, keyEnc, sftpKeyEnc := h.encryptFields(req)

	bc, err := h.q.InsertBankConnection(r.Context(), dbgen.InsertBankConnectionParams{
		ID:             settPgUUID(id),
		ClientID:       settPgUUID(tid),
		BankCode:       req.BankCode,
		BankName:       req.BankName,
		AuthMethod:     req.AuthMethod,
		CredentialsEnc: credsEnc,
		CertificateEnc: certEnc,
		PrivateKeyEnc:  keyEnc,
		Nonce:          nonce,
		SftpHost:       settPgText(req.SFTPHost),
		SftpUser:       settPgText(req.SFTPUser),
		SftpKeyEnc:     sftpKeyEnc,
		SftpRemessaDir: settPgText(req.SFTPRemessa),
		SftpRetornoDir: settPgText(req.SFTPRetorno),
		Status:         "draft",
	})
	if err != nil {
		slog.Error("create bank connection", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "create_failed"})
		return
	}
	writeJSON(w, http.StatusCreated, toBankConnectionResp(bc))
}

func (h *SettingsHandler) GetBankConnection(w http.ResponseWriter, r *http.Request) {
	bcID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_id"})
		return
	}
	tid := mw.TenantFromContext(r.Context())
	bc, err := h.q.GetBankConnection(r.Context(), dbgen.GetBankConnectionParams{
		ID: settPgUUID(bcID), ClientID: settPgUUID(tid),
	})
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not_found"})
		return
	}
	writeJSON(w, http.StatusOK, toBankConnectionResp(bc))
}

func (h *SettingsHandler) UpdateBankConnection(w http.ResponseWriter, r *http.Request) {
	bcID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_id"})
		return
	}
	var req createBankConnectionReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_body"})
		return
	}

	tid := mw.TenantFromContext(r.Context())
	nonce, credsEnc, certEnc, keyEnc, sftpKeyEnc := h.encryptFields(req)

	err = h.q.UpdateBankConnectionCredentials(r.Context(), dbgen.UpdateBankConnectionCredentialsParams{
		ID:             settPgUUID(bcID),
		ClientID:       settPgUUID(tid),
		CredentialsEnc: credsEnc,
		CertificateEnc: certEnc,
		PrivateKeyEnc:  keyEnc,
		Nonce:          nonce,
		SftpHost:       settPgText(req.SFTPHost),
		SftpUser:       settPgText(req.SFTPUser),
		SftpKeyEnc:     sftpKeyEnc,
		SftpRemessaDir: settPgText(req.SFTPRemessa),
		SftpRetornoDir: settPgText(req.SFTPRetorno),
	})
	if err != nil {
		slog.Error("update bank connection", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "update_failed"})
		return
	}
	// Reset status to draft after credential change
	_ = h.q.UpdateBankConnectionStatus(r.Context(), dbgen.UpdateBankConnectionStatusParams{
		ID: settPgUUID(bcID), ClientID: settPgUUID(tid),
		Status: "draft", ValidationAttempts: 0,
		LastValidationError: pgtype.Text{},
	})
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *SettingsHandler) DeleteBankConnection(w http.ResponseWriter, r *http.Request) {
	bcID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_id"})
		return
	}
	tid := mw.TenantFromContext(r.Context())
	_ = h.q.DeleteBankConnection(r.Context(), dbgen.DeleteBankConnectionParams{
		ID: settPgUUID(bcID), ClientID: settPgUUID(tid),
	})
	writeJSON(w, http.StatusNoContent, nil)
}

// ─── Validate ───

const maxValidationAttempts = 3

func (h *SettingsHandler) ValidateBankConnection(w http.ResponseWriter, r *http.Request) {
	bcID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid_id"})
		return
	}
	tid := mw.TenantFromContext(r.Context())
	bc, err := h.q.GetBankConnection(r.Context(), dbgen.GetBankConnectionParams{
		ID: settPgUUID(bcID), ClientID: settPgUUID(tid),
	})
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not_found"})
		return
	}

	attempts := int(bc.ValidationAttempts) + 1
	if attempts > maxValidationAttempts {
		writeJSON(w, http.StatusUnprocessableEntity, map[string]any{
			"error":           "max_attempts_reached",
			"attempts":        attempts - 1,
			"contact_support": "contato@doublethree.com.br",
			"message":         "Limite de tentativas atingido. Entre em contato com o suporte para continuar.",
		})
		return
	}

	// Set to validating
	_ = h.q.UpdateBankConnectionStatus(r.Context(), dbgen.UpdateBankConnectionStatusParams{
		ID: settPgUUID(bcID), ClientID: settPgUUID(tid),
		Status: "validating", ValidationAttempts: int32(attempts),
		LastValidationError: pgtype.Text{},
	})

	// Decrypt credentials
	creds, decErr := h.decryptCredentials(bc)
	if decErr != nil {
		slog.Error("decrypt bank creds", "err", decErr)
		_ = h.q.UpdateBankConnectionStatus(r.Context(), dbgen.UpdateBankConnectionStatusParams{
			ID: settPgUUID(bcID), ClientID: settPgUUID(tid),
			Status: "failed", ValidationAttempts: int32(attempts),
			LastValidationError: pgtype.Text{String: "Erro interno ao decriptar credenciais", Valid: true},
		})
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "decrypt_failed"})
		return
	}

	// Find validator for this bank
	validator, ok := h.validators[bc.BankCode]
	if !ok {
		_ = h.q.UpdateBankConnectionStatus(r.Context(), dbgen.UpdateBankConnectionStatusParams{
			ID: settPgUUID(bcID), ClientID: settPgUUID(tid),
			Status: "failed", ValidationAttempts: int32(attempts),
			LastValidationError: pgtype.Text{String: "Banco " + bc.BankCode + " não suportado ainda", Valid: true},
		})
		writeJSON(w, http.StatusUnprocessableEntity, map[string]any{"error": "unsupported_bank", "bank_code": bc.BankCode})
		return
	}

	// Run health check
	if valErr := validator.Validate(r.Context(), creds); valErr != nil {
		status := "failed"
		if attempts >= maxValidationAttempts {
			status = "failed"
		}
		errMsg := valErr.Error()
		_ = h.q.UpdateBankConnectionStatus(r.Context(), dbgen.UpdateBankConnectionStatusParams{
			ID: settPgUUID(bcID), ClientID: settPgUUID(tid),
			Status: status, ValidationAttempts: int32(attempts),
			LastValidationError: pgtype.Text{String: errMsg, Valid: true},
		})

		resp := map[string]any{"error": "validation_failed", "message": errMsg, "attempts": attempts}
		if attempts >= maxValidationAttempts {
			resp["contact_support"] = "contato@doublethree.com.br"
			resp["message"] = errMsg + " — Limite de tentativas atingido. Entre em contato com o suporte."
		}
		writeJSON(w, http.StatusUnprocessableEntity, resp)
		return
	}

	// Success
	_ = h.q.UpdateBankConnectionStatus(r.Context(), dbgen.UpdateBankConnectionStatusParams{
		ID: settPgUUID(bcID), ClientID: settPgUUID(tid),
		Status: "active", ValidationAttempts: int32(attempts),
		LastValidationError: pgtype.Text{},
	})
	writeJSON(w, http.StatusOK, map[string]any{"status": "active", "message": "Conexão validada com sucesso"})
}

// ─── Onboarding ───

func (h *SettingsHandler) CompleteOnboarding(w http.ResponseWriter, r *http.Request) {
	tid := mw.TenantFromContext(r.Context())
	_ = h.q.SetOnboardingCompleted(r.Context(), settPgUUID(tid))
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// ─── Encryption helpers ───

func (h *SettingsHandler) encryptFields(req createBankConnectionReq) (nonce, credsEnc, certEnc, keyEnc, sftpKeyEnc []byte) {
	nonce = make([]byte, 12)
	io.ReadFull(rand.Reader, nonce)

	block, _ := aes.NewCipher(h.encKey)
	gcm, _ := cipher.NewGCM(block)

	if len(req.Credentials) > 0 {
		credsEnc = gcm.Seal(nil, nonce, req.Credentials, nil)
	}
	if req.CertPEM != "" {
		certEnc = gcm.Seal(nil, nonce, []byte(req.CertPEM), nil)
	}
	if req.KeyPEM != "" {
		keyEnc = gcm.Seal(nil, nonce, []byte(req.KeyPEM), nil)
	}
	if req.SFTPKeyPEM != "" {
		sftpKeyEnc = gcm.Seal(nil, nonce, []byte(req.SFTPKeyPEM), nil)
	}
	return
}

func (h *SettingsHandler) decryptCredentials(bc dbgen.BankConnection) (BankCredentials, error) {
	block, err := aes.NewCipher(h.encKey)
	if err != nil {
		return BankCredentials{}, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return BankCredentials{}, err
	}

	var creds BankCredentials
	if len(bc.CredentialsEnc) > 0 {
		plain, err := gcm.Open(nil, bc.Nonce, bc.CredentialsEnc, nil)
		if err != nil {
			return creds, err
		}
		json.Unmarshal(plain, &creds)
	}
	if len(bc.CertificateEnc) > 0 {
		plain, _ := gcm.Open(nil, bc.Nonce, bc.CertificateEnc, nil)
		creds.CertPEM = plain
	}
	if len(bc.PrivateKeyEnc) > 0 {
		plain, _ := gcm.Open(nil, bc.Nonce, bc.PrivateKeyEnc, nil)
		creds.KeyPEM = plain
	}
	if len(bc.SftpKeyEnc) > 0 {
		plain, _ := gcm.Open(nil, bc.Nonce, bc.SftpKeyEnc, nil)
		creds.SFTPKeyPEM = plain
	}
	creds.SFTPHost = bc.SftpHost.String
	creds.SFTPUser = bc.SftpUser.String
	creds.SFTPRemessa = bc.SftpRemessaDir.String
	creds.SFTPRetorno = bc.SftpRetornoDir.String
	return creds, nil
}

// ─── Helpers (settings-specific) ───

func condStr(c bool, a, b string) string {
	if c {
		return a
	}
	return b
}

func settPgUUID(u uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: u, Valid: true}
}

func settPgText(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: s != ""}
}

func settUUIDStr(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return uuid.UUID(u.Bytes).String()
}
