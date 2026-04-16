-- +goose Up
-- +goose StatementBegin

-- Branding + onboarding fields on clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_primary_color CHAR(7) NOT NULL DEFAULT '#143573',
  ADD COLUMN IF NOT EXISTS brand_accent_color CHAR(7) NOT NULL DEFAULT '#1e4ea8',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Generate slug from name for existing rows
UPDATE clients SET slug = LOWER(REGEXP_REPLACE(REPLACE(name, ' ', '-'), '[^a-z0-9\-]', '', 'g'))
  WHERE slug IS NULL;

-- Bank connections — one per bank per tenant
CREATE TABLE bank_connections (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id            UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    bank_code            CHAR(3) NOT NULL,
    bank_name            TEXT NOT NULL,
    auth_method          TEXT NOT NULL CHECK (auth_method IN ('OAUTH2_MTLS', 'OAUTH2_CERT', 'API_KEY', 'CERTIFICATE_A1')),
    credentials_enc      BYTEA,
    certificate_enc      BYTEA,
    private_key_enc      BYTEA,
    nonce                BYTEA,
    sftp_host            TEXT,
    sftp_user            TEXT,
    sftp_key_enc         BYTEA,
    sftp_remessa_dir     TEXT,
    sftp_retorno_dir     TEXT,
    status               TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validating', 'active', 'failed', 'expired')),
    validation_attempts  INT NOT NULL DEFAULT 0,
    last_validation_error TEXT,
    last_validated_at    TIMESTAMPTZ,
    expires_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(client_id, bank_code)
);

CREATE INDEX idx_bank_connections_client ON bank_connections(client_id);
CREATE INDEX idx_bank_connections_status ON bank_connections(status) WHERE status != 'draft';

-- Link payer_accounts to bank_connections
ALTER TABLE payer_accounts
  ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES bank_connections(id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE payer_accounts DROP COLUMN IF EXISTS bank_connection_id;
DROP TABLE IF EXISTS bank_connections;
ALTER TABLE clients
  DROP COLUMN IF EXISTS slug,
  DROP COLUMN IF EXISTS logo_url,
  DROP COLUMN IF EXISTS brand_primary_color,
  DROP COLUMN IF EXISTS brand_accent_color,
  DROP COLUMN IF EXISTS onboarding_completed;
-- +goose StatementEnd
