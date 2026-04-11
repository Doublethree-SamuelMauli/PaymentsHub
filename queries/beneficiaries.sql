-- name: InsertBeneficiary :one
INSERT INTO beneficiaries (
    id, kind, legal_name, trade_name, document_type, document_number,
    email, phone, tags, default_payment_method, notes, active
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: GetBeneficiary :one
SELECT * FROM beneficiaries WHERE id = $1;

-- name: GetBeneficiaryByDocument :one
SELECT * FROM beneficiaries WHERE document_number = $1;

-- name: ListBeneficiaries :many
SELECT * FROM beneficiaries
WHERE active = TRUE
ORDER BY legal_name
LIMIT $1 OFFSET $2;

-- name: InsertBeneficiaryPixKey :one
INSERT INTO beneficiary_pix_keys (id, beneficiary_id, key_type, key_value, label, active, verified_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListBeneficiaryPixKeys :many
SELECT * FROM beneficiary_pix_keys
WHERE beneficiary_id = $1 AND active = TRUE
ORDER BY created_at DESC;

-- name: InsertBeneficiaryBankAccount :one
INSERT INTO beneficiary_bank_accounts (
    id, beneficiary_id, bank_code, agency, account_number, account_digit,
    account_type, label, active, verified_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: ListBeneficiaryBankAccounts :many
SELECT * FROM beneficiary_bank_accounts
WHERE beneficiary_id = $1 AND active = TRUE
ORDER BY created_at DESC;
