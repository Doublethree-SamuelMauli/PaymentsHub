-- +goose Up
-- +goose StatementBegin
CREATE TABLE beneficiaries (
    id                     UUID PRIMARY KEY,
    kind                   TEXT NOT NULL CHECK (kind IN ('SUPPLIER','CLIENT','EMPLOYEE','GOVERNMENT','OTHER')),
    legal_name             TEXT NOT NULL,
    trade_name             TEXT,
    document_type          TEXT NOT NULL CHECK (document_type IN ('CPF','CNPJ')),
    document_number        TEXT NOT NULL,
    email                  TEXT,
    phone                  TEXT,
    tags                   TEXT[] NOT NULL DEFAULT '{}',
    default_payment_method TEXT CHECK (default_payment_method IN ('PIX','TED')),
    notes                  TEXT,
    active                 BOOLEAN NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_number)
);

CREATE INDEX idx_beneficiaries_kind ON beneficiaries (kind) WHERE active;
CREATE INDEX idx_beneficiaries_legal_name ON beneficiaries USING gin (to_tsvector('portuguese', legal_name));

CREATE TABLE beneficiary_pix_keys (
    id             UUID PRIMARY KEY,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    key_type       TEXT NOT NULL CHECK (key_type IN ('CPF','CNPJ','EMAIL','PHONE','EVP')),
    key_value      TEXT NOT NULL,
    label          TEXT,
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    verified_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ben_pix_keys_ben ON beneficiary_pix_keys (beneficiary_id) WHERE active;

CREATE TABLE beneficiary_bank_accounts (
    id             UUID PRIMARY KEY,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    bank_code      CHAR(3) NOT NULL,
    agency         TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_digit  TEXT NOT NULL,
    account_type   TEXT NOT NULL CHECK (account_type IN ('CC','CP','PG')),
    label          TEXT,
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    verified_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ben_bank_accounts_ben ON beneficiary_bank_accounts (beneficiary_id) WHERE active;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE beneficiary_bank_accounts;
DROP TABLE beneficiary_pix_keys;
DROP TABLE beneficiaries;
-- +goose StatementEnd
