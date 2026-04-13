-- name: GetDuplicateRule :one
SELECT * FROM duplicate_rules WHERE client_id = $1 AND active = TRUE;

-- name: InsertDuplicateRule :one
INSERT INTO duplicate_rules (id, client_id, window_hours, match_fields, action)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: FindDuplicatePayments :many
SELECT * FROM payments
WHERE client_id = $1
  AND beneficiary_id = $2
  AND amount_cents = $3
  AND created_at > $4
  AND status NOT IN ('REJECTED', 'CANCELED', 'EXPIRED')
  AND id != $5
ORDER BY created_at DESC
LIMIT 5;
