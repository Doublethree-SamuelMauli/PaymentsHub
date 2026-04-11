-- name: InsertCnabFile :one
INSERT INTO cnab_files (
    id, run_id, bank_code, layout_version, sequence_number, direction,
    file_path, file_hash, status, total_items, generated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: GetCnabFile :one
SELECT * FROM cnab_files WHERE id = $1;

-- name: GetCnabFileByHash :one
SELECT * FROM cnab_files WHERE file_hash = $1;

-- name: ListCnabFilesByRun :many
SELECT * FROM cnab_files
WHERE run_id = $1
ORDER BY direction, sequence_number;

-- name: UpdateCnabFileStatus :one
UPDATE cnab_files
SET status = $2,
    uploaded_at = COALESCE($3, uploaded_at),
    upload_ack = COALESCE($4, upload_ack),
    returned_at = COALESCE($5, returned_at),
    processed_at = COALESCE($6, processed_at)
WHERE id = $1
RETURNING *;

-- name: ListCnabFilesByStatus :many
SELECT * FROM cnab_files WHERE status = $1 ORDER BY generated_at;
