-- +goose Up
-- +goose StatementBegin

-- River requires its own schema. We use the river_migrate tool embedded in the
-- Go library. This migration is a placeholder that documents the dependency.
-- The actual river tables are created by river.Migrate() at worker startup.

-- Create river_migration tracking table if it doesn't exist yet.
-- River v0.x manages its own schema; we just need the extension for advisory locks.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- River tables are managed by the library. Nothing to roll back here.
-- +goose StatementEnd
