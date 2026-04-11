-- name: InsertPaymentRun :one
INSERT INTO payment_runs (id, run_date, status)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetPaymentRun :one
SELECT * FROM payment_runs WHERE id = $1;

-- name: GetPaymentRunForUpdate :one
SELECT * FROM payment_runs WHERE id = $1 FOR UPDATE;

-- name: UpdatePaymentRunStatus :one
UPDATE payment_runs
SET status = $2,
    approved_at = $3,
    approved_by = $4,
    closed_at = $5
WHERE id = $1
RETURNING *;

-- name: UpdatePaymentRunCounters :exec
UPDATE payment_runs
SET total_items = $2,
    total_amount_cents = $3,
    pix_count = $4,
    ted_count = $5
WHERE id = $1;

-- name: ListPaymentRunsByDate :many
SELECT * FROM payment_runs
WHERE run_date BETWEEN $1 AND $2
ORDER BY run_date DESC, created_at DESC;

-- name: AttachPaymentToRun :one
INSERT INTO payment_run_items (run_id, payment_id, channel)
VALUES ($1, $2, $3)
RETURNING *;

-- name: DetachPaymentFromRun :exec
DELETE FROM payment_run_items WHERE run_id = $1 AND payment_id = $2;

-- name: ListRunItems :many
SELECT * FROM payment_run_items WHERE run_id = $1 ORDER BY payment_id;

-- name: MarkRunItemExecuted :exec
UPDATE payment_run_items SET executed_at = now() WHERE run_id = $1 AND payment_id = $2;

-- name: MarkRunItemSettled :exec
UPDATE payment_run_items SET settled_at = now() WHERE run_id = $1 AND payment_id = $2;
