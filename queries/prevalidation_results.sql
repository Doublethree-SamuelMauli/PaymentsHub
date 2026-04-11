-- name: InsertPrevalidationResult :one
INSERT INTO prevalidation_results (
    id, payment_id, provider, request, response, verdict, reason
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListPrevalidationsByPayment :many
SELECT * FROM prevalidation_results
WHERE payment_id = $1
ORDER BY validated_at DESC;

-- name: LatestPrevalidation :one
SELECT * FROM prevalidation_results
WHERE payment_id = $1 AND provider = $2
ORDER BY validated_at DESC
LIMIT 1;
