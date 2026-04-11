-- +goose Up
-- +goose StatementBegin
CREATE TABLE prevalidation_results (
    id           UUID PRIMARY KEY,
    payment_id   UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    provider     TEXT NOT NULL,
    request      JSONB NOT NULL,
    response     JSONB NOT NULL,
    verdict      TEXT NOT NULL CHECK (verdict IN ('OK','REJECT','WARN')),
    reason       TEXT,
    validated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prevalidation_payment ON prevalidation_results (payment_id, validated_at DESC);
CREATE INDEX idx_prevalidation_provider ON prevalidation_results (provider, verdict);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE prevalidation_results;
-- +goose StatementEnd
