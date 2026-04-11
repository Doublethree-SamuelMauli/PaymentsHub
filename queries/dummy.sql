-- name: GetSchemaMetadataValue :one
SELECT value FROM schema_metadata WHERE key = $1;
