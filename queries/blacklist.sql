-- name: InsertBlacklistEntry :one
INSERT INTO blacklist_entries (id, client_id, document_number, reason, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: CheckBlacklist :many
SELECT * FROM blacklist_entries
WHERE document_number = $1 AND active = TRUE
  AND (client_id IS NULL OR client_id = $2);

-- name: ListBlacklistByClient :many
SELECT * FROM blacklist_entries
WHERE (client_id IS NULL OR client_id = $1) AND active = TRUE
ORDER BY created_at DESC;

-- name: DeactivateBlacklistEntry :exec
UPDATE blacklist_entries SET active = FALSE WHERE id = $1;
