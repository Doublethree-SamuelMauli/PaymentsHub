-- +goose Up
-- +goose StatementBegin
CREATE TABLE payment_runs (
    id                 UUID PRIMARY KEY,
    run_date           DATE NOT NULL,
    status             TEXT NOT NULL CHECK (status IN (
        'OPEN','APPROVED','EXECUTING','PARTIALLY_SETTLED','CLOSED','FAILED'
    )),
    approved_at        TIMESTAMPTZ,
    approved_by        TEXT,
    total_items        INT NOT NULL DEFAULT 0,
    total_amount_cents BIGINT NOT NULL DEFAULT 0,
    pix_count          INT NOT NULL DEFAULT 0,
    ted_count          INT NOT NULL DEFAULT 0,
    summary            JSONB,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at          TIMESTAMPTZ
);

CREATE INDEX idx_payment_runs_date ON payment_runs (run_date DESC);
CREATE INDEX idx_payment_runs_status ON payment_runs (status);

CREATE TABLE payment_run_items (
    run_id      UUID NOT NULL REFERENCES payment_runs(id),
    payment_id  UUID NOT NULL REFERENCES payments(id),
    channel     TEXT NOT NULL CHECK (channel IN ('PIX_REST','CNAB_TED')),
    executed_at TIMESTAMPTZ,
    settled_at  TIMESTAMPTZ,
    PRIMARY KEY (run_id, payment_id),
    UNIQUE (payment_id)
);

CREATE INDEX idx_payment_run_items_channel ON payment_run_items (channel, settled_at);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE payment_run_items;
DROP TABLE payment_runs;
-- +goose StatementEnd
