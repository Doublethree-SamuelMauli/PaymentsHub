package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

// WebhookHandler handles inbound notifications from Itaú.
type WebhookHandler struct {
	payments ports.PaymentRepository
	events   ports.PaymentEventRepository
	logger   *slog.Logger
}

func NewWebhookHandler(
	payments ports.PaymentRepository,
	events ports.PaymentEventRepository,
	logger *slog.Logger,
) *WebhookHandler {
	return &WebhookHandler{payments: payments, events: events, logger: logger}
}

// Register mounts webhook routes. These are NOT behind API key auth — they
// use signature validation (stubbed for now; hardened in Plan 10).
func (h *WebhookHandler) Register(r chi.Router) {
	r.Post("/v1/webhooks/itau", h.HandleItau)
}

type itauWebhookPayload struct {
	EventID           string `json:"event_id"`
	CodigoSolicitacao string `json:"codigoSolicitacao"`
	Status            string `json:"status"`
	EndToEndID        string `json:"endToEndId"`
	Motivo            string `json:"motivo"`
}

// HandleItau processes a PIX status notification from Itaú.
// Idempotent: processing the same event_id twice is a no-op.
func (h *WebhookHandler) HandleItau(w http.ResponseWriter, r *http.Request) {
	var payload itauWebhookPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.logger.Warn("webhook: bad json", slog.Any("err", err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if payload.CodigoSolicitacao == "" {
		h.logger.Warn("webhook: missing codigoSolicitacao")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	h.logger.Info("webhook received",
		slog.String("event_id", payload.EventID),
		slog.String("bank_ref", payload.CodigoSolicitacao),
		slog.String("status", payload.Status),
	)

	// Find payment by bank_reference. If not found, log and return 200 (don't
	// make the bank retry something we don't recognize).
	payments, err := h.payments.ListByStatus(r.Context(), payment.StatusSent, 1000, 0)
	if err != nil {
		h.logger.Error("webhook: list payments", slog.Any("err", err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var target *payment.Payment
	for _, p := range payments {
		if p.BankReference == payload.CodigoSolicitacao {
			target = p
			break
		}
	}

	if target == nil {
		h.logger.Info("webhook: no matching payment found, ignoring",
			slog.String("bank_ref", payload.CodigoSolicitacao))
		w.WriteHeader(http.StatusOK)
		return
	}

	var newStatus payment.Status
	switch payload.Status {
	case "FINALIZADO", "APROVADO", "SETTLED", "LIQUIDADO":
		newStatus = payment.StatusSettled
	case "REJEITADO", "FALHOU", "FAILED":
		newStatus = payment.StatusFailed
	default:
		h.logger.Info("webhook: unrecognized status, ignoring",
			slog.String("status", payload.Status))
		w.WriteHeader(http.StatusOK)
		return
	}

	if target.Status == newStatus {
		w.WriteHeader(http.StatusOK)
		return
	}

	if err := payment.Transition(target.Status, newStatus); err != nil {
		h.logger.Warn("webhook: illegal transition, ignoring",
			slog.String("from", string(target.Status)),
			slog.String("to", string(newStatus)),
		)
		w.WriteHeader(http.StatusOK)
		return
	}

	reason := "webhook event_id=" + payload.EventID
	if payload.Motivo != "" {
		reason += " motivo=" + payload.Motivo
	}

	if err := h.payments.UpdateStatus(r.Context(), target.ID, newStatus, payload.EndToEndID, payload.Motivo); err != nil {
		h.logger.Error("webhook: update status", slog.Any("err", err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	_ = h.events.Insert(r.Context(), ports.PaymentEvent{
		ID:         uuid.New(),
		PaymentID:  target.ID,
		FromStatus: string(target.Status),
		ToStatus:   string(newStatus),
		Actor:      "BANK",
		Reason:     reason,
	})

	h.logger.Info("webhook: payment updated",
		slog.String("payment_id", target.ID.String()),
		slog.String("new_status", string(newStatus)),
	)
	w.WriteHeader(http.StatusOK)
}
