-- User contact methods & communication preferences (profile → Datos personales).
-- Exposed via pg_graphql on public.user and user_contact_profile view for AI routing.

alter table public."user"
  add column if not exists phone_number text,
  add column if not exists whatsapp_number text,
  add column if not exists telegram_username text,
  add column if not exists allow_phone_calls boolean not null default false,
  add column if not exists allow_whatsapp_messages boolean not null default false,
  add column if not exists allow_telegram_messages boolean not null default false,
  add column if not exists allow_email_contact boolean not null default true,
  add column if not exists preferred_contact_hours text;

comment on column public."user".phone_number is 'User phone for outbound contact (digits or formatted).';
comment on column public."user".whatsapp_number is 'WhatsApp number for outbound contact.';
comment on column public."user".telegram_username is 'Public Telegram @username (without @).';
comment on column public."user".allow_phone_calls is 'User opt-in: allow phone calls.';
comment on column public."user".allow_whatsapp_messages is 'User opt-in: allow WhatsApp messages.';
comment on column public."user".allow_telegram_messages is 'User opt-in: allow Telegram messages.';
comment on column public."user".allow_email_contact is 'User opt-in: allow email contact.';
comment on column public."user".preferred_contact_hours is 'Optional preferred contact window (free text).';

-- Telegram bot connection (mirrors vendor_telegram; webhook link flow deferred to future PR).
create table if not exists public.user_telegram (
  user_id uuid primary key references public."user"(id) on delete cascade,
  chat_id text,
  username text,
  connected_at timestamptz,
  link_token text,
  link_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_telegram_link_token_key
  on public.user_telegram (link_token)
  where link_token is not null;

create unique index if not exists user_telegram_chat_id_key
  on public.user_telegram (chat_id)
  where chat_id is not null;

alter table public.user_telegram enable row level security;

create policy "Users can view own telegram connection"
  on public.user_telegram
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own telegram connection"
  on public.user_telegram
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own telegram connection"
  on public.user_telegram
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger user_telegram_set_updated_at
  before update on public.user_telegram
  for each row execute function public.handle_updated_at();

-- Read model for GraphQL / AI contact routing (security invoker → respects user RLS).
create or replace view public.user_contact_profile
with (security_invoker = true)
as
select
  u.id as user_id,
  u.email,
  u.phone_number,
  u.whatsapp_number,
  coalesce(nullif(trim(u.telegram_username), ''), ut.username) as telegram_username,
  (ut.chat_id is not null) as telegram_connected,
  ut.connected_at as telegram_connected_at,
  u.allow_phone_calls,
  u.allow_whatsapp_messages,
  u.allow_telegram_messages,
  u.allow_email_contact,
  u.preferred_contact_hours
from public."user" u
left join public.user_telegram ut on ut.user_id = u.id;

comment on view public.user_contact_profile is
  'Unified user contact methods and preferences for GraphQL consumers and AI routing.';

grant select on public.user_contact_profile to authenticated;
grant select on public.user_contact_profile to service_role;
