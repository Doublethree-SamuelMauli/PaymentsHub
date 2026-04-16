-- name: InsertBankConnection :one
INSERT INTO bank_connections (
    id, client_id, bank_code, bank_name, auth_method,
    credentials_enc, certificate_enc, private_key_enc, nonce,
    sftp_host, sftp_user, sftp_key_enc, sftp_remessa_dir, sftp_retorno_dir,
    status
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
RETURNING *;

-- name: GetBankConnection :one
SELECT * FROM bank_connections WHERE id = $1 AND client_id = $2;

-- name: GetBankConnectionByBank :one
SELECT * FROM bank_connections WHERE client_id = $1 AND bank_code = $2;

-- name: ListBankConnections :many
SELECT * FROM bank_connections WHERE client_id = $1 ORDER BY bank_name;

-- name: UpdateBankConnectionCredentials :exec
UPDATE bank_connections SET
    credentials_enc = $3, certificate_enc = $4, private_key_enc = $5, nonce = $6,
    sftp_host = $7, sftp_user = $8, sftp_key_enc = $9, sftp_remessa_dir = $10, sftp_retorno_dir = $11,
    updated_at = now()
WHERE id = $1 AND client_id = $2;

-- name: UpdateBankConnectionStatus :exec
UPDATE bank_connections SET
    status = $3,
    validation_attempts = $4,
    last_validation_error = $5,
    last_validated_at = CASE WHEN $3 = 'active' THEN now() ELSE last_validated_at END,
    updated_at = now()
WHERE id = $1 AND client_id = $2;

-- name: DeleteBankConnection :exec
DELETE FROM bank_connections WHERE id = $1 AND client_id = $2;

-- name: CountActiveBankConnections :one
SELECT count(*) FROM bank_connections WHERE client_id = $1 AND status = 'active';
