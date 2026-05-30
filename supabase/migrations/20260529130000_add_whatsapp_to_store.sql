-- Public WhatsApp contact for the vendor storefront.
-- `whatsapp_number` is stored as digits only (country code + number, no "+"),
-- so it can be used directly in https://wa.me/<number> links.
-- `show_whatsapp` lets the vendor toggle public visibility.

alter table public.store
  add column if not exists whatsapp_number text,
  add column if not exists show_whatsapp boolean not null default true;
