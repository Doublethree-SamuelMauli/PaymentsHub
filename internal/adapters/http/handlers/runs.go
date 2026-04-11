package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
	"github.com/vanlink-ltda/paymentshub/internal/app"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
)

// RunsHandler exposes /v1/runs/* and payment-level approval actions.
type RunsHandler struct {
	runs *app.RunService
}

func NewRunsHandler(runs *app.RunService) *RunsHandler {
	return &RunsHandler{runs: runs}
}

func (h *RunsHandler) Register(r chi.Router) {
	r.Route("/v1/runs", func(r chi.Router) {
		r.With(mw.RequireScope("runs:write")).Post("/", h.Create)
		r.With(mw.RequireScope("runs:write")).Post("/{id}/attach", h.Attach)
		r.With(mw.RequireScope("runs:write")).Post("/{id}/detach", h.Detach)
		r.With(mw.RequireScope("runs:approve")).Post("/{id}/approve", h.Approve)
	})
	r.With(mw.RequireScope("payments:write")).Post("/v1/payments/{id}/hold", h.Hold)
	r.With(mw.RequireScope("payments:write")).Post("/v1/payments/{id}/unhold", h.Unhold)
	r.With(mw.RequireScope("payments:write")).Post("/v1/payments/{id}/cancel", h.Cancel)
	r.With(mw.RequireScope("payments:write")).Post("/v1/payments/{id}/reject", h.Reject)
}

type createRunReq struct {
	RunDate string `json:"run_date" validate:"omitempty,datetime=2006-01-02"`
}

func (h *RunsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createRunReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err.Error() != "EOF" {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	date := time.Now()
	if req.RunDate != "" {
		d, err := time.Parse("2006-01-02", req.RunDate)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid run_date", nil)
			return
		}
		date = d
	}
	run, err := h.runs.CreateRun(r.Context(), date)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "create run", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"id":       run.ID.String(),
		"run_date": run.RunDate.Format("2006-01-02"),
		"status":   string(run.Status),
	})
}

type attachReq struct {
	PaymentIDs []string `json:"payment_ids" validate:"required,dive,uuid4"`
}

func (h *RunsHandler) Attach(w http.ResponseWriter, r *http.Request) {
	runID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid run id", nil)
		return
	}
	var req attachReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}

	attached := make([]string, 0, len(req.PaymentIDs))
	rejected := make([]map[string]string, 0)
	for _, idStr := range req.PaymentIDs {
		pid, err := uuid.Parse(idStr)
		if err != nil {
			rejected = append(rejected, map[string]string{"payment_id": idStr, "error": "invalid uuid"})
			continue
		}
		if err := h.runs.AttachPayment(r.Context(), runID, pid); err != nil {
			rejected = append(rejected, map[string]string{"payment_id": idStr, "error": err.Error()})
			continue
		}
		attached = append(attached, idStr)
	}
	writeJSON(w, http.StatusOK, map[string]any{"attached": attached, "rejected": rejected})
}

func (h *RunsHandler) Detach(w http.ResponseWriter, r *http.Request) {
	runID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid run id", nil)
		return
	}
	var req attachReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	for _, idStr := range req.PaymentIDs {
		pid, err := uuid.Parse(idStr)
		if err != nil {
			continue
		}
		_ = h.runs.DetachPayment(r.Context(), runID, pid)
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *RunsHandler) Approve(w http.ResponseWriter, r *http.Request) {
	runID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid run id", nil)
		return
	}
	approver := mw.APIKeyLabelFromContext(r.Context())
	run, err := h.runs.ApproveRun(r.Context(), runID, approver)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeJSONError(w, http.StatusNotFound, "run not found", nil)
		return
	case errors.Is(err, domain.ErrConflict) || errors.Is(err, domain.ErrIllegalTransition):
		writeJSONError(w, http.StatusConflict, "cannot approve", map[string]any{"detail": err.Error()})
		return
	case err != nil:
		writeJSONError(w, http.StatusInternalServerError, "approve failed", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"id":                 run.ID.String(),
		"status":             string(run.Status),
		"approved_by":        run.ApprovedBy,
		"approved_at":        run.ApprovedAt,
		"total_items":        run.TotalItems,
		"total_amount_cents": run.TotalAmount.Int64(),
		"pix_count":          run.PixCount,
		"ted_count":          run.TedCount,
	})
}

type reasonReq struct {
	Reason string `json:"reason"`
}

func (h *RunsHandler) payTransition(
	w http.ResponseWriter, r *http.Request,
	action func(context.Context, uuid.UUID, string, string) error,
	successCode int,
) {
	pid, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id", nil)
		return
	}
	var body reasonReq
	_ = json.NewDecoder(r.Body).Decode(&body)
	actor := mw.APIKeyLabelFromContext(r.Context())
	if err := action(r.Context(), pid, actor, body.Reason); err != nil {
		switch {
		case errors.Is(err, domain.ErrNotFound):
			writeJSONError(w, http.StatusNotFound, "payment not found", nil)
			return
		case errors.Is(err, domain.ErrConflict) || errors.Is(err, domain.ErrIllegalTransition):
			writeJSONError(w, http.StatusConflict, "cannot apply", map[string]any{"detail": err.Error()})
			return
		default:
			writeJSONError(w, http.StatusInternalServerError, "transition failed", map[string]any{"detail": err.Error()})
			return
		}
	}
	w.WriteHeader(successCode)
}

func (h *RunsHandler) Hold(w http.ResponseWriter, r *http.Request) {
	h.payTransition(w, r, h.runs.HoldPayment, http.StatusNoContent)
}

func (h *RunsHandler) Unhold(w http.ResponseWriter, r *http.Request) {
	h.payTransition(w, r, h.runs.UnholdPayment, http.StatusNoContent)
}

func (h *RunsHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	h.payTransition(w, r, h.runs.CancelPayment, http.StatusNoContent)
}

func (h *RunsHandler) Reject(w http.ResponseWriter, r *http.Request) {
	h.payTransition(w, r, h.runs.RejectPayment, http.StatusNoContent)
}
