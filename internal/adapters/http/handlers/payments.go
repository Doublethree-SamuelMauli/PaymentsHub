// Package handlers holds the chi HTTP handlers for PaymentsHub endpoints.
// Handlers are intentionally thin: they parse/validate input, call an
// application service, and render the result.
package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/http/dto"
	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
	"github.com/vanlink-ltda/paymentshub/internal/app"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

// PaymentsHandler wires the chi routes for /v1/payments*.
type PaymentsHandler struct {
	validate *validator.Validate
	receive  *app.ReceivePayment
	payments ports.PaymentRepository
	events   ports.PaymentEventRepository
}

// NewPaymentsHandler constructs the handler.
func NewPaymentsHandler(
	receive *app.ReceivePayment,
	payments ports.PaymentRepository,
	events ports.PaymentEventRepository,
) *PaymentsHandler {
	return &PaymentsHandler{
		validate: validator.New(validator.WithRequiredStructEnabled()),
		receive:  receive,
		payments: payments,
		events:   events,
	}
}

// Register mounts the payment routes on a chi router under /v1/payments.
func (h *PaymentsHandler) Register(r chi.Router) {
	r.Route("/v1/payments", func(r chi.Router) {
		r.Get("/{id}", h.Get)
		r.With(mw.RequireScope("payments:write")).Post("/", h.Create)
	})
}

// Create handles POST /v1/payments.
func (h *PaymentsHandler) Create(w http.ResponseWriter, r *http.Request) {
	idemKey := r.Header.Get("Idempotency-Key")
	if idemKey == "" {
		writeJSONError(w, http.StatusBadRequest, "missing Idempotency-Key header", nil)
		return
	}

	rawBody, err := io.ReadAll(io.LimitReader(r.Body, 1<<20)) // 1 MiB cap
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "cannot read body", nil)
		return
	}
	defer r.Body.Close()

	var req dto.CreatePaymentRequest
	if err := json.Unmarshal(rawBody, &req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", map[string]any{"detail": err.Error()})
		return
	}
	if err := h.validate.Struct(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "validation failed", map[string]any{"detail": err.Error()})
		return
	}

	payerID, err := uuid.Parse(req.PayerAccountID)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid payer_account_id", nil)
		return
	}

	var beneficiaryID *uuid.UUID
	if req.BeneficiaryID != "" {
		bid, err := uuid.Parse(req.BeneficiaryID)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid beneficiary_id", nil)
			return
		}
		beneficiaryID = &bid
	}

	var payee map[string]any
	if err := json.Unmarshal(req.Payee, &payee); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid payee", nil)
		return
	}

	var scheduledFor *time.Time
	if req.ScheduledFor != "" {
		d, err := time.Parse("2006-01-02", req.ScheduledFor)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid scheduled_for", nil)
			return
		}
		scheduledFor = &d
	}

	in := app.ReceivePaymentInput{
		IdempotencyKey: idemKey,
		ExternalID:     req.ExternalID,
		Type:           payment.Type(req.Type),
		AmountCents:    req.AmountCents,
		PayerAccountID: payerID,
		BeneficiaryID:  beneficiaryID,
		PayeeMethod:    payment.PayeeMethod(req.PayeeMethod),
		Payee:          payee,
		Description:    req.Description,
		ScheduledFor:   scheduledFor,
		Actor:          "apikey:" + mw.APIKeyLabelFromContext(r.Context()),
		RequestHash:    app.HashRequestBody(rawBody),
	}

	result, err := h.receive.Execute(r.Context(), in)
	switch {
	case errors.Is(err, domain.ErrInvalidInput):
		writeJSONError(w, http.StatusBadRequest, "invalid input", map[string]any{"detail": err.Error()})
		return
	case errors.Is(err, app.ErrIdempotencyMismatch):
		writeJSONError(w, http.StatusConflict, "idempotency_key reused with different payload", nil)
		return
	case err != nil:
		writeJSONError(w, http.StatusInternalServerError, "internal error", map[string]any{"detail": err.Error()})
		return
	}

	status := http.StatusCreated
	if result.Replayed {
		status = http.StatusOK
	}
	writeJSON(w, status, dto.PaymentResponse{
		ID:             result.Payment.ID.String(),
		ExternalID:     result.Payment.ExternalID,
		Type:           string(result.Payment.Type),
		Status:         string(result.Payment.Status),
		AmountCents:    result.Payment.Amount.Int64(),
		Currency:       result.Payment.Currency,
		PayerAccountID: result.Payment.PayerAccountID.String(),
		PayeeMethod:    string(result.Payment.PayeeMethod),
		Payee:          result.Payment.Payee,
		Description:    result.Payment.Description,
		IdempotencyKey: result.Payment.IdempotencyKey,
		CreatedAt:      result.Payment.CreatedAt,
		UpdatedAt:      result.Payment.UpdatedAt,
	})
}

// Get handles GET /v1/payments/:id.
func (h *PaymentsHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id", nil)
		return
	}

	p, err := h.payments.Get(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			writeJSONError(w, http.StatusNotFound, "payment not found", nil)
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "load payment", nil)
		return
	}

	events, err := h.events.ListForPayment(r.Context(), id)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "load events", nil)
		return
	}

	timeline := make([]dto.PaymentEventResponse, 0, len(events))
	for _, e := range events {
		timeline = append(timeline, dto.PaymentEventResponse{
			At:         e.At,
			FromStatus: e.FromStatus,
			ToStatus:   e.ToStatus,
			Actor:      e.Actor,
			Reason:     e.Reason,
			Payload:    e.Payload,
		})
	}

	resp := dto.PaymentDetailResponse{
		Payment: dto.PaymentResponse{
			ID:             p.ID.String(),
			ExternalID:     p.ExternalID,
			Type:           string(p.Type),
			Status:         string(p.Status),
			AmountCents:    p.Amount.Int64(),
			Currency:       p.Currency,
			PayerAccountID: p.PayerAccountID.String(),
			PayeeMethod:    string(p.PayeeMethod),
			Payee:          p.Payee,
			Description:    p.Description,
			IdempotencyKey: p.IdempotencyKey,
			BankReference:  p.BankReference,
			CreatedAt:      p.CreatedAt,
			UpdatedAt:      p.UpdatedAt,
		},
		Timeline: timeline,
	}
	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, code int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(body)
}

func writeJSONError(w http.ResponseWriter, code int, msg string, details map[string]any) {
	writeJSON(w, code, dto.ErrorResponse{Error: msg, Details: details})
}
