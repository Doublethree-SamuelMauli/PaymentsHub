-- +goose Up
-- +goose StatementBegin
CREATE TABLE api_keys (
    id           UUID PRIMARY KEY,
    label        TEXT NOT NULL,
    key_hash     TEXT NOT NULL UNIQUE,
    scopes       TEXT[] NOT NULL DEFAULT '{}',
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_active ON api_keys (active) WHERE active;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE api_keys;
-- +goose StatementEnd
