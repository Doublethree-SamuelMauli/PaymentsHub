-- name: InsertClientLimit :one
INSERT INTO client_limits (id, client_id, daily_limit_cents, monthly_limit_cents, max_single_cents, require_approval_above)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetClientLimit :one
SELECT * FROM client_limits WHERE client_id = $1 AND active = TRUE;

-- name: UpdateClientLimit :exec
UPDATE client_limits
SET daily_limit_cents = $2, monthly_limit_cents = $3, max_single_cents = $4,
    require_approval_above = $5, updated_at = now()
WHERE client_id = $1;

-- name: SumPaymentsTodayByClient :one
SELECT COALESCE(SUM(amount_cents), 0)::bigint AS total
FROM payments
WHERE client_id = $1
  AND created_at >= CURRENT_DATE
  AND status NOT IN ('REJECTED', 'CANCELED', 'EXPIRED');

-- name: SumPaymentsMonthByClient :one
SELECT COALESCE(SUM(amount_cents), 0)::bigint AS total
FROM payments
WHERE client_id = $1
  AND created_at >= date_trunc('month', CURRENT_DATE)
  AND status NOT IN ('REJECTED', 'CANCELED', 'EXPIRED');
