-- Telegram notifications integration for vendors.
--
-- A single centralized bot (e.g. @MercadoJustoBot) connects to many vendors.
-- Each vendor links their Telegram account via a one-time, short-lived token
-- (deep link: https://t.me/<bot>?start=vendor_<token>). The webhook resolves the
-- token to a store and stores the resulting chat_id.
--
-- This data lives in a DEDICATED table (not on `public.store`) on purpose:
-- `public.store` has a public SELECT policy (`using (true)`), so any anon client
-- can read every store column. Keeping chat_id / link tokens here lets us scope
-- access strictly to the owning vendor via RLS while keeping the storefront public.

create table if not exists public.vendor_telegram (
  store_id uuid primary key references public.store(id) on delete cascade,

  -- Connection (set by the webhook once the vendor links the bot).
  chat_id text,
  username text,
  connected_at timestamptz,

  -- Master switch + per-event preferences.
  enabled boolean not null default false,
  notify_new_orders boolean not null default true,
  notify_new_reviews boolean not null default true,
  notify_new_followers boolean not null default true,
  notify_low_stock boolean not null default true,

  -- One-time connect token (cleared after a successful link).
  link_token text,
  link_token_expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The webhook resolves an incoming /start payload to a single store via this token.
create unique index if not exists vendor_telegram_link_token_key
  on public.vendor_telegram (link_token)
  where link_token is not null;

-- Fast lookup by chat_id for inbound updates (commands / callbacks).
create unique index if not exists vendor_telegram_chat_id_key
  on public.vendor_telegram (chat_id)
  where chat_id is not null;

alter table public.vendor_telegram enable row level security;

-- A vendor can read and manage only their own integration row.
-- The webhook and outbound notification dispatch use the service-role client,
-- which bypasses RLS, so no public/insert-by-others policy is needed.
create policy "Vendors can view own telegram settings"
  on public.vendor_telegram
  for select
  using (auth.uid() = store_id);

create policy "Vendors can insert own telegram settings"
  on public.vendor_telegram
  for insert
  with check (auth.uid() = store_id);

create policy "Vendors can update own telegram settings"
  on public.vendor_telegram
  for update
  using (auth.uid() = store_id)
  with check (auth.uid() = store_id);

create trigger vendor_telegram_set_updated_at
  before update on public.vendor_telegram
  for each row execute function public.handle_updated_at();
