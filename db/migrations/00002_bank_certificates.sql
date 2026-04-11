-- +goose Up
-- +goose StatementBegin
CREATE TABLE bank_certificates (
    id           UUID PRIMARY KEY,
    bank_code    CHAR(3) NOT NULL,
    purpose      TEXT NOT NULL CHECK (purpose IN ('mTLS', 'signing')),
    cert_pem_enc BYTEA NOT NULL,
    key_pem_enc  BYTEA NOT NULL,
    nonce        BYTEA NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_certificates_bank_purpose ON bank_certificates (bank_code, purpose);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE bank_certificates;
-- +goose StatementEnd
