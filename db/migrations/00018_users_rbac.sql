-- +goose Up
-- +goose StatementBegin

CREATE TABLE users (
    id            UUID PRIMARY KEY,
    client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin','approver','operator','viewer')),
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email) WHERE active;
CREATE INDEX idx_users_client ON users (client_id) WHERE active;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE users;
-- +goose StatementEnd
