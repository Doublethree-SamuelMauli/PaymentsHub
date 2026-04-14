-- +goose Up
-- +goose StatementBegin

-- Permite reagendar um pagamento para outra data
ALTER TABLE payments ADD COLUMN rescheduled_from DATE;
ALTER TABLE payments ADD COLUMN rescheduled_reason TEXT;

-- Status extra para reagendados (nao-terminal): RESCHEDULED
-- Nao precisa alterar CHECK constraint pois RESCHEDULED vira um estado transitorio
-- que volta pra RECEIVED no run do novo dia.

-- Historico de motivos de rejeicao em um campo estruturado
ALTER TABLE payments ADD COLUMN operator_notes TEXT;

CREATE INDEX idx_payments_rescheduled ON payments(rescheduled_from) WHERE rescheduled_from IS NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_payments_rescheduled;
ALTER TABLE payments DROP COLUMN IF EXISTS operator_notes;
ALTER TABLE payments DROP COLUMN IF EXISTS rescheduled_reason;
ALTER TABLE payments DROP COLUMN IF EXISTS rescheduled_from;
-- +goose StatementEnd
