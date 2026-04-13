-- name: InsertWebhookDelivery :one
INSERT INTO webhook_deliveries (
    id, client_id, payment_id, event_type, payload, status
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetWebhookDelivery :one
SELECT * FROM webhook_deliveries WHERE id = $1;

-- name: ListPendingWebhookDeliveries :many
SELECT * FROM webhook_deliveries
WHERE status = 'PENDING'
ORDER BY created_at ASC
LIMIT $1;

-- name: UpdateWebhookDeliveryStatus :exec
UPDATE webhook_deliveries
SET status = $2,
    response_status = $3,
    response_body = $4,
    attempts = attempts + 1,
    last_attempt_at = now()
WHERE id = $1;

-- name: ListWebhookDeliveriesByPayment :many
SELECT * FROM webhook_deliveries
WHERE payment_id = $1
ORDER BY created_at DESC;
