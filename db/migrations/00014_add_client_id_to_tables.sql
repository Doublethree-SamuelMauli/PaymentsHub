-- +goose Up
-- +goose StatementBegin

-- Add client_id to all tenant-scoped tables.
-- NULL is allowed temporarily for backward compatibility with Fase 1 data.
-- Fase 2 application layer enforces NOT NULL at the use-case level.

ALTER TABLE api_keys ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE payments ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE beneficiaries ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE payment_runs ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE payer_accounts ADD COLUMN client_id UUID REFERENCES clients(id);

CREATE INDEX idx_api_keys_client ON api_keys (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_payments_client ON payments (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_beneficiaries_client ON beneficiaries (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_payment_runs_client ON payment_runs (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_payer_accounts_client ON payer_accounts (client_id) WHERE client_id IS NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_payer_accounts_client;
DROP INDEX IF EXISTS idx_payment_runs_client;
DROP INDEX IF EXISTS idx_beneficiaries_client;
DROP INDEX IF EXISTS idx_payments_client;
DROP INDEX IF EXISTS idx_api_keys_client;

ALTER TABLE payer_accounts DROP COLUMN IF EXISTS client_id;
ALTER TABLE payment_runs DROP COLUMN IF EXISTS client_id;
ALTER TABLE beneficiaries DROP COLUMN IF EXISTS client_id;
ALTER TABLE payments DROP COLUMN IF EXISTS client_id;
ALTER TABLE api_keys DROP COLUMN IF EXISTS client_id;
-- +goose StatementEnd
