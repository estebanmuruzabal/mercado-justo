-- =============================================================================
-- Mercado Justo — staging demo seed
-- Reuses the development demo dataset for preview / QA environments.
-- To apply on a remote staging project:
--   supabase db push --db-url "$SUPABASE_STAGING_DB_URL" --include-seed
--   (configure sql_paths in config or run seed.staging.sql manually via psql)
-- =============================================================================

\ir seed.dev.sql
