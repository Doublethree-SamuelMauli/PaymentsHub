-- name: InsertClient :one
INSERT INTO clients (id, name, document_type, document_number, active, webhook_url, webhook_secret)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetClient :one
SELECT * FROM clients WHERE id = $1;

-- name: GetClientByDocument :one
SELECT * FROM clients WHERE document_number = $1;

-- name: ListClients :many
SELECT * FROM clients WHERE active = TRUE ORDER BY name;

-- name: UpdateClientWebhook :exec
UPDATE clients SET webhook_url = $2, webhook_secret = $3, updated_at = now() WHERE id = $1;

-- name: SetClientActive :exec
UPDATE clients SET active = $2, updated_at = now() WHERE id = $1;

-- name: UpdateClientBranding :exec
UPDATE clients SET
    slug = $2,
    logo_url = $3,
    brand_primary_color = $4,
    brand_accent_color = $5,
    updated_at = now()
WHERE id = $1;

-- name: SetOnboardingCompleted :exec
UPDATE clients SET onboarding_completed = TRUE, updated_at = now() WHERE id = $1;

-- name: GetClientBySlug :one
SELECT * FROM clients WHERE slug = $1;
