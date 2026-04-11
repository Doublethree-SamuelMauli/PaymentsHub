-- name: InsertPaymentEvent :one
INSERT INTO payment_events (
    id, payment_id, from_status, to_status, actor, reason, payload, correlation_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: ListPaymentEventsForPayment :many
SELECT * FROM payment_events
WHERE payment_id = $1
ORDER BY at ASC;
