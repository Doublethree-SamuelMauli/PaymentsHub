package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
	"github.com/vanlink-ltda/paymentshub/internal/app"
	"github.com/vanlink-ltda/paymentshub/internal/domain"
)

// RunsHandler exposes /v1/runs/* and payment-level approval actions.
type RunsHandler struct {
	runs *app.RunService
	q    *dbgen.Queries
	pool *pgxpool.Pool
}

func NewRunsHandler(runs *app.RunService, pool *pgxpool.Pool) *RunsHandler {
	return &RunsHandler{runs: runs, q: dbgen.New(pool), pool: pool}
}

func (h *RunsHandler) ListRuns(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	from := pgtype.Date{Time: now.AddDate(0, -1, 0), Valid: true}
	to := pgtype.Date{Time: now.AddDate(0, 0, 1), Valid: true}
	rows, err := h.q.ListPaymentRunsByDate(r.Context(), dbgen.ListPaymentRunsByDateParams{
		RunDate:   from,
		RunDate_2: to,
	})
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "list runs", nil)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		out = append(out, map[string]any{
			"id":                 uuid.UUID(row.ID.Bytes).String(),
			"run_date":           row.RunDate.Time.Format("2006-01-02"),
			"status":             row.Status,
			"total_items":        row.TotalItems,
			"total_amount_cents": row.TotalAmountCents,
			"pix_count":          row.PixCount,
			"ted_count":          row.TedCount,
			"approved_by":        row.ApprovedBy.String,
		})
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *RunsHandler) Register(r chi.Router) {
	r.Route("/v1/runs", func(r chi.Router) {
		r.Get("/", h.ListRuns)
		r.Get("/{id}", h.GetRun)
		r.Get("/{id}/payments", h.ListRunPayments)
		r.With(mw.RequireScope("runs:write")).Post("/", h.Create)
		r.With(mw.RequireScope("runs:write")).Post("/{id}/attach", h.Attach)
		r.With(mw.RequireScope("runs:write")).Post("/{id}/detach", h.Detach)
		r.With(mw.RequireScope("runs:approve")).Post("/{id}/approve", h.Approve)
		r.With(mw.RequireScope("runs:approve")).Post("/{id}/submit-to-bank", h.SubmitToBank)
	})
	r.With(mw.RequireScope("payments:write")).Post("/v1/payments/{id}/hold", h.Hold)
	r.With(mw.RequireScope("payments:write")).Post("/v1/payments/{id}/unhold", h.Unhold)
	r.With(mw.RequireScope("payments:write")).Post("/v1/payments/{id}/cancel", h.Cancel)
	r.With(mw.RequireScope("payments:write")).Post("/v1/payments/{id}/reject", h.Reject)
	r.With(mw.RequireScope("payments:write")).Post("/v1/payments/{id}/reschedule", h.Reschedule)
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

// tenantOwnsRun verifies the authenticated tenant owns the run.
// Returns (true, nil) on success, (false, nil) when the run is not found or
// owned by another tenant (return 404 to both avoid enumeration).
func (h *RunsHandler) tenantOwnsRun(ctx context.Context, tenant uuid.UUID, runID pgtype.UUID) (bool, error) {
	if tenant == uuid.Nil {
		// No tenant = admin global key (Fase 1 backward compat). Allow.
		return true, nil
	}
	// Use raw SQL to check ownership without needing new sqlc queries
	row, err := h.q.GetPaymentRun(ctx, runID)
	if err != nil {
		return false, nil
	}
	if !row.ClientID.Valid {
		return true, nil
	}
	return uuid.UUID(row.ClientID.Bytes) == tenant, nil
}

func (h *RunsHandler) GetRun(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id", nil)
		return
	}
	pgID := pgtype.UUID{Bytes: id, Valid: true}
	tenant := mw.TenantFromContext(r.Context())
	ok, _ := h.tenantOwnsRun(r.Context(), tenant, pgID)
	if !ok {
		writeJSONError(w, http.StatusNotFound, "run not found", nil)
		return
	}
	row, err := h.q.GetPaymentRun(r.Context(), pgID)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "run not found", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"id":                 uuid.UUID(row.ID.Bytes).String(),
		"run_date":           row.RunDate.Time.Format("2006-01-02"),
		"status":             row.Status,
		"total_items":        row.TotalItems,
		"total_amount_cents": row.TotalAmountCents,
		"pix_count":          row.PixCount,
		"ted_count":          row.TedCount,
		"approved_by":        row.ApprovedBy.String,
		"approved_at":        row.ApprovedAt.Time,
		"closed_at":          row.ClosedAt.Time,
	})
}

func (h *RunsHandler) ListRunPayments(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id", nil)
		return
	}
	pgID := pgtype.UUID{Bytes: id, Valid: true}
	tenant := mw.TenantFromContext(r.Context())
	ok, _ := h.tenantOwnsRun(r.Context(), tenant, pgID)
	if !ok {
		writeJSONError(w, http.StatusNotFound, "run not found", nil)
		return
	}
	rows, err := h.q.ListPaymentsForRun(r.Context(), pgID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "list payments", nil)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		out = append(out, map[string]any{
			"id":           uuid.UUID(row.ID.Bytes).String(),
			"external_id":  row.ExternalID.String,
			"type":         row.Type,
			"status":       row.Status,
			"amount_cents": row.AmountCents,
			"description":  row.Description.String,
			"created_at":   row.CreatedAt.Time,
		})
	}
	writeJSON(w, http.StatusOK, out)
}

// SubmitToBank consolidates the approved run and submits to the bank as a
// single batch. PIX payments are sent via REST; TED payments are bundled into
// a single CNAB 240 file and uploaded via SFTP. In Fase 1 this just transitions
// the run to EXECUTING and relies on the worker pipeline to actually send.
// Uses a transactional WHERE status='APPROVED' guard to prevent double-submit races.
func (h *RunsHandler) SubmitToBank(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id", nil)
		return
	}
	pgID := pgtype.UUID{Bytes: id, Valid: true}
	tenant := mw.TenantFromContext(r.Context())
	ok, _ := h.tenantOwnsRun(r.Context(), tenant, pgID)
	if !ok {
		writeJSONError(w, http.StatusNotFound, "run not found", nil)
		return
	}
	actor := mw.APIKeyLabelFromContext(r.Context())

	// Atomic transition APPROVED -> EXECUTING using a conditional UPDATE.
	// This prevents race conditions when two operators click "submit" simultaneously.
	tx, err := h.pool.Begin(r.Context())
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "begin tx", nil)
		return
	}
	defer tx.Rollback(r.Context())

	var currentStatus string
	err = tx.QueryRow(r.Context(),
		`UPDATE payment_runs SET status='EXECUTING' WHERE id=$1 AND status='APPROVED' RETURNING status`,
		id,
	).Scan(&currentStatus)
	if err != nil {
		// No row matched -> run is not in APPROVED state (or doesn't exist)
		writeJSONError(w, http.StatusConflict, "run must be APPROVED to submit", nil)
		return
	}

	// Audit trail: record the submission in payment_events for every payment in the run
	_, _ = tx.Exec(r.Context(), `
		INSERT INTO payment_events (id, payment_id, from_status, to_status, actor, reason, correlation_id)
		SELECT gen_random_uuid(), i.payment_id, p.status, p.status, $1, $2, $3
		FROM payment_run_items i JOIN payments p ON p.id = i.payment_id
		WHERE i.run_id = $4
	`, "user:"+actor, "run submitted to bank", id.String(), id)

	if err := tx.Commit(r.Context()); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "commit tx", nil)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"run_id":       id.String(),
		"status":       "EXECUTING",
		"submitted_at": time.Now(),
		"message":      "Run submetido ao banco. PIX sendo enviados via REST, TED agrupados em CNAB 240.",
	})
}

type rescheduleReq struct {
	NewDate string `json:"new_date"`
	Reason  string `json:"reason"`
}

func (h *RunsHandler) Reschedule(w http.ResponseWriter, r *http.Request) {
	pid, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id", nil)
		return
	}
	var body rescheduleReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	if body.NewDate == "" {
		writeJSONError(w, http.StatusBadRequest, "new_date required", nil)
		return
	}
	newDate, err := time.Parse("2006-01-02", body.NewDate)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid date format (use YYYY-MM-DD)", nil)
		return
	}
	if newDate.Before(time.Now().Truncate(24 * time.Hour)) {
		writeJSONError(w, http.StatusBadRequest, "cannot reschedule to past date", nil)
		return
	}
	actor := mw.APIKeyLabelFromContext(r.Context())
	if err := h.runs.ReschedulePayment(r.Context(), pid, newDate, actor, body.Reason); err != nil {
		switch {
		case errors.Is(err, domain.ErrNotFound):
			writeJSONError(w, http.StatusNotFound, "payment not found", nil)
			return
		case errors.Is(err, domain.ErrConflict) || errors.Is(err, domain.ErrIllegalTransition):
			writeJSONError(w, http.StatusConflict, "cannot reschedule", map[string]any{"detail": err.Error()})
			return
		default:
			writeJSONError(w, http.StatusInternalServerError, "reschedule failed", map[string]any{"detail": err.Error()})
			return
		}
	}
	w.WriteHeader(http.StatusNoContent)
}
