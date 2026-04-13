-- +goose Up
-- +goose StatementBegin

-- Per-client daily and monthly payment limits.
CREATE TABLE client_limits (
    id                    UUID PRIMARY KEY,
    client_id             UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    daily_limit_cents     BIGINT NOT NULL DEFAULT 0,
    monthly_limit_cents   BIGINT NOT NULL DEFAULT 0,
    max_single_cents      BIGINT NOT NULL DEFAULT 0,
    require_approval_above BIGINT NOT NULL DEFAULT 0,
    active                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (client_id)
);

-- Global or per-client blacklist of document numbers.
CREATE TABLE blacklist_entries (
    id              UUID PRIMARY KEY,
    client_id       UUID REFERENCES clients(id) ON DELETE CASCADE,
    document_number TEXT NOT NULL,
    reason          TEXT NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blacklist_doc ON blacklist_entries (document_number) WHERE active;
CREATE INDEX idx_blacklist_client ON blacklist_entries (client_id) WHERE active;

-- Duplicate detection window config per client.
CREATE TABLE duplicate_rules (
    id                UUID PRIMARY KEY,
    client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    window_hours      INT NOT NULL DEFAULT 24,
    match_fields      TEXT[] NOT NULL DEFAULT '{beneficiary_id,amount_cents,scheduled_for}',
    action            TEXT NOT NULL DEFAULT 'REVIEW' CHECK (action IN ('REVIEW','REJECT','ALLOW')),
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (client_id)
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE duplicate_rules;
DROP TABLE blacklist_entries;
DROP TABLE client_limits;
-- +goose StatementEnd
