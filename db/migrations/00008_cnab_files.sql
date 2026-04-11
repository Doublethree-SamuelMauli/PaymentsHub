-- +goose Up
-- +goose StatementBegin
CREATE TABLE cnab_files (
    id              UUID PRIMARY KEY,
    run_id          UUID NOT NULL REFERENCES payment_runs(id),
    bank_code       CHAR(3) NOT NULL,
    layout_version  TEXT NOT NULL,
    sequence_number INT NOT NULL,
    direction       TEXT NOT NULL CHECK (direction IN ('REMESSA','RETORNO')),
    file_path       TEXT NOT NULL,
    file_hash       TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN (
        'DRAFT','GENERATED','UPLOADED','AWAITING_RETURN','RETURNED','CLOSED','FAILED'
    )),
    total_items     INT NOT NULL DEFAULT 0,
    generated_at    TIMESTAMPTZ,
    uploaded_at     TIMESTAMPTZ,
    upload_ack      TEXT,
    returned_at     TIMESTAMPTZ,
    processed_at    TIMESTAMPTZ,
    UNIQUE (file_hash)
);

CREATE INDEX idx_cnab_files_run ON cnab_files (run_id, direction);
CREATE INDEX idx_cnab_files_status ON cnab_files (status);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE cnab_files;
-- +goose StatementEnd
