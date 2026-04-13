-- +goose Up
-- +goose StatementBegin
CREATE TABLE clients (
    id              UUID PRIMARY KEY,
    name            TEXT NOT NULL,
    document_type   TEXT NOT NULL CHECK (document_type IN ('CPF','CNPJ')),
    document_number TEXT NOT NULL UNIQUE,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    webhook_url     TEXT,
    webhook_secret  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_active ON clients (active) WHERE active;
CREATE INDEX idx_clients_document ON clients (document_number);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE clients;
-- +goose StatementEnd
