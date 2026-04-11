-- +goose Up
-- +goose StatementBegin
CREATE TABLE payer_accounts (
    id               UUID PRIMARY KEY,
    bank_code        CHAR(3) NOT NULL,
    agency           TEXT NOT NULL,
    account_number   TEXT NOT NULL,
    account_digit    TEXT NOT NULL,
    certificate_id   UUID REFERENCES bank_certificates(id),
    oauth_client_id  TEXT NOT NULL,
    oauth_secret_ref TEXT NOT NULL,
    sftp_host        TEXT,
    sftp_user        TEXT,
    sftp_key_ref     TEXT,
    sftp_remessa_dir TEXT,
    sftp_retorno_dir TEXT,
    label            TEXT NOT NULL UNIQUE,
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payer_accounts_bank ON payer_accounts (bank_code) WHERE active;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE payer_accounts;
-- +goose StatementEnd
