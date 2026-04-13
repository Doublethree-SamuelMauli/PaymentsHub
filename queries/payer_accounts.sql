-- name: InsertPayerAccount :one
INSERT INTO payer_accounts (
    id, bank_code, agency, account_number, account_digit,
    certificate_id, oauth_client_id, oauth_secret_ref,
    sftp_host, sftp_user, sftp_key_ref, sftp_remessa_dir, sftp_retorno_dir,
    label, active, client_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
RETURNING *;

-- name: GetPayerAccount :one
SELECT * FROM payer_accounts WHERE id = $1;

-- name: GetPayerAccountByLabel :one
SELECT * FROM payer_accounts WHERE label = $1;

-- name: ListPayerAccounts :many
SELECT * FROM payer_accounts ORDER BY label;

-- name: SetPayerAccountActive :exec
UPDATE payer_accounts SET active = $2, updated_at = now() WHERE id = $1;
