-- name: InsertBankCertificate :one
INSERT INTO bank_certificates (id, bank_code, purpose, cert_pem_enc, key_pem_enc, nonce, expires_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetBankCertificate :one
SELECT * FROM bank_certificates WHERE id = $1;

-- name: ListBankCertificatesByBank :many
SELECT * FROM bank_certificates
WHERE bank_code = $1 AND purpose = $2
ORDER BY expires_at DESC;

-- name: DeleteBankCertificate :exec
DELETE FROM bank_certificates WHERE id = $1;
