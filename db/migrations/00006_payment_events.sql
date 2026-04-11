-- +goose Up
-- +goose StatementBegin
CREATE TABLE payment_events (
    id             UUID PRIMARY KEY,
    payment_id     UUID NOT NULL REFERENCES payments(id),
    at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    from_status    TEXT,
    to_status      TEXT NOT NULL,
    actor          TEXT NOT NULL,
    reason         TEXT,
    payload        JSONB,
    correlation_id TEXT
);

CREATE INDEX idx_payment_events_payment ON payment_events (payment_id, at);
CREATE INDEX idx_payment_events_correlation ON payment_events (correlation_id) WHERE correlation_id IS NOT NULL;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION payment_events_immutable() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'payment_events is append-only';
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TRIGGER payment_events_no_update
    BEFORE UPDATE ON payment_events
    FOR EACH ROW EXECUTE FUNCTION payment_events_immutable();
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TRIGGER payment_events_no_delete
    BEFORE DELETE ON payment_events
    FOR EACH ROW EXECUTE FUNCTION payment_events_immutable();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TRIGGER IF EXISTS payment_events_no_update ON payment_events;
DROP TRIGGER IF EXISTS payment_events_no_delete ON payment_events;
DROP FUNCTION IF EXISTS payment_events_immutable();
DROP TABLE payment_events;
-- +goose StatementEnd
