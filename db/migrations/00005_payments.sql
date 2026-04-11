-- +goose Up
-- +goose StatementBegin
CREATE TABLE payments (
    id                   UUID PRIMARY KEY,
    external_id          TEXT,
    type                 TEXT NOT NULL CHECK (type IN ('PIX','TED')),
    status               TEXT NOT NULL CHECK (status IN (
        'RECEIVED','VALIDATED_LOCAL','UNDER_REVIEW','PREVALIDATED',
        'APPROVED','ON_HOLD','SUBMITTING','SENT','SETTLED',
        'FAILED','REJECTED','CANCELED','EXPIRED'
    )),
    amount_cents         BIGINT NOT NULL CHECK (amount_cents > 0),
    currency             CHAR(3) NOT NULL DEFAULT 'BRL',
    payer_account_id     UUID NOT NULL REFERENCES payer_accounts(id),
    beneficiary_id       UUID REFERENCES beneficiaries(id),
    beneficiary_snapshot JSONB NOT NULL,
    payee_method         TEXT NOT NULL CHECK (payee_method IN ('PIX_KEY','BANK_ACCOUNT')),
    payee                JSONB NOT NULL,
    description          TEXT,
    scheduled_for        DATE,
    idempotency_key      TEXT NOT NULL,
    bank_reference       TEXT,
    rejection_reason     TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (idempotency_key)
);

CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_type_status ON payments (type, status);
CREATE INDEX idx_payments_external_id ON payments (external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_payments_created_at ON payments (created_at DESC);
CREATE INDEX idx_payments_beneficiary ON payments (beneficiary_id) WHERE beneficiary_id IS NOT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE payments;
-- +goose StatementEnd
