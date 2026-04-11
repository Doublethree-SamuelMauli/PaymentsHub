-- +goose Up
-- +goose StatementBegin
CREATE TABLE schema_metadata (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO schema_metadata (key, value) VALUES
    ('application',  'paymentshub'),
    ('plan_applied', '01-foundations');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE schema_metadata;
-- +goose StatementEnd
