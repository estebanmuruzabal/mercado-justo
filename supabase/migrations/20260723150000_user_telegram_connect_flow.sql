-- Complete user Telegram connect flow: store telegram user id + expose chat id for AI routing.

alter table public.user_telegram
  add column if not exists telegram_user_id text;

create unique index if not exists user_telegram_telegram_user_id_key
  on public.user_telegram (telegram_user_id)
  where telegram_user_id is not null;

comment on column public.user_telegram.telegram_user_id is
  'Telegram user id (message.from.id) for outbound bot messages.';

drop view if exists public.user_contact_profile;

create view public.user_contact_profile
with (security_invoker = true)
as
select
  u.id as user_id,
  u.email,
  u.phone_number,
  u.whatsapp_number,
  coalesce(nullif(trim(u.telegram_username), ''), ut.username) as telegram_username,
  ut.telegram_user_id,
  ut.chat_id as telegram_chat_id,
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
