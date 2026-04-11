-- +goose Up
-- +goose StatementBegin
CREATE TABLE idempotency_keys (
    key               TEXT PRIMARY KEY,
    scope             TEXT NOT NULL,
    request_hash      TEXT NOT NULL,
    response_snapshot JSONB NOT NULL,
    status_code       INT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_idem_expires ON idempotency_keys (expires_at);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE idempotency_keys;
-- +goose StatementEnd
