-- =============================================================================
-- Mercado Justo — shared seed (all environments)
-- Master data: categories and global catalogs. Safe for dev, staging, production.
-- Idempotent: ON CONFLICT DO NOTHING.
-- =============================================================================

create extension if not exists "pgcrypto";

insert into public.category (name, is_visible)
values
  ('Verduras', true),
  ('Frutas', true),
  ('Hongos', true),
  ('Cannabis', true),
  ('Tecnología', true),
  ('Artesanías', true),
  ('Plantas', true),
  ('Mascotas', true),
  ('Servicios', true)
on conflict (name) do nothing;
