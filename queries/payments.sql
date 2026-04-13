-- name: InsertPayment :one
INSERT INTO payments (
    id, external_id, type, status, amount_cents, currency,
    payer_account_id, beneficiary_id, beneficiary_snapshot,
    payee_method, payee, description, scheduled_for, idempotency_key,
    client_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
)
RETURNING *;

-- name: GetPayment :one
SELECT * FROM payments WHERE id = $1;

-- name: GetPaymentForUpdate :one
SELECT * FROM payments WHERE id = $1 FOR UPDATE;

-- name: GetPaymentByIdempotencyKey :one
SELECT * FROM payments WHERE idempotency_key = $1;

-- name: UpdatePaymentStatus :one
UPDATE payments
SET status = $2, updated_at = now(), bank_reference = COALESCE($3, bank_reference),
    rejection_reason = COALESCE($4, rejection_reason)
WHERE id = $1
RETURNING *;

-- name: ListPaymentsByStatus :many
SELECT * FROM payments
WHERE status = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListPaymentsByClientAndStatus :many
SELECT * FROM payments
WHERE client_id = $1 AND status = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: ListAllPayments :many
SELECT * FROM payments
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountPaymentsByStatus :one
SELECT count(*) FROM payments WHERE status = $1;

-- name: ListPaymentsForRun :many
SELECT p.*
FROM payments p
JOIN payment_run_items i ON i.payment_id = p.id
WHERE i.run_id = $1
ORDER BY p.created_at;
