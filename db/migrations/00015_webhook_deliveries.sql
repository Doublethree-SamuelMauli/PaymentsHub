-- +goose Up
-- +goose StatementBegin
CREATE TABLE webhook_deliveries (
    id              UUID PRIMARY KEY,
    client_id       UUID NOT NULL REFERENCES clients(id),
    payment_id      UUID NOT NULL REFERENCES payments(id),
    event_type      TEXT NOT NULL,
    payload         JSONB NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('PENDING','DELIVERED','FAILED')),
    response_status INT,
    response_body   TEXT,
    attempts        INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_deliveries_client ON webhook_deliveries (client_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries (status) WHERE status = 'PENDING';
CREATE INDEX idx_webhook_deliveries_payment ON webhook_deliveries (payment_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE webhook_deliveries;
-- +goose StatementEnd
