-- name: InsertApiKey :one
INSERT INTO api_keys (id, label, key_hash, scopes, active, expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetApiKeyByHash :one
SELECT * FROM api_keys WHERE key_hash = $1 AND active = TRUE;

-- name: ListApiKeys :many
SELECT * FROM api_keys ORDER BY created_at DESC;

-- name: RevokeApiKey :exec
UPDATE api_keys SET active = FALSE WHERE id = $1;

-- name: TouchApiKey :exec
UPDATE api_keys SET last_used_at = now() WHERE id = $1;
