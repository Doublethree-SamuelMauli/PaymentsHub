-- name: InsertUser :one
INSERT INTO users (id, client_id, email, password_hash, name, role, active)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 AND active = TRUE;

-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: ListUsersByClient :many
SELECT * FROM users WHERE client_id = $1 ORDER BY name;

-- name: ListAllUsers :many
SELECT * FROM users ORDER BY name;

-- name: UpdateUserRole :exec
UPDATE users SET role = $2, updated_at = now() WHERE id = $1;

-- name: SetUserActive :exec
UPDATE users SET active = $2, updated_at = now() WHERE id = $1;

-- name: UpdateUserPassword :exec
UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1;

-- name: TouchUserLogin :exec
UPDATE users SET last_login_at = now() WHERE id = $1;
