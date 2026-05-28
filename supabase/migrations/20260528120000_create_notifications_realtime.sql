-- In-app notifications with Supabase Realtime (postgres_changes).

create table if not exists public.notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null check (audience in ('buyer', 'vendor')),
  type text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notification_user_id_created_at_idx
  on public.notification (user_id, created_at desc);

create index if not exists notification_user_unread_idx
  on public.notification (user_id)
  where read = false;

alter table public.notification enable row level security;

create policy "Users can view own notifications"
  on public.notification
  for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notification
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserts are performed by security definer triggers only.

create or replace function public.notify_order_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification (user_id, audience, type, title, body, href, metadata)
  values (
    new.seller_id,
    'vendor',
    'order_new',
    'Nuevo pedido recibido',
    'Tenés un nuevo pedido pendiente de gestión.',
    '/dashboard-vendor/ventas',
    jsonb_build_object('order_id', new.id, 'total', new.total)
  );

  insert into public.notification (user_id, audience, type, title, body, href, metadata)
  values (
    new.buyer_id,
    'buyer',
    'order_status',
    'Pedido registrado',
    'Tu compra fue confirmada. Te avisamos cuando haya novedades.',
    '/profile/sales',
    jsonb_build_object('order_id', new.id, 'total', new.total)
  );

  return new;
end;
$$;

create or replace function public.notify_order_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  insert into public.notification (user_id, audience, type, title, body, href, metadata)
  values (
    new.seller_id,
    'vendor',
    'order_updated',
    'Estado del pedido actualizado',
    format('El pedido pasó a: %s', new.status),
    '/dashboard-vendor/ventas',
    jsonb_build_object('order_id', new.id, 'status', new.status)
  );

  insert into public.notification (user_id, audience, type, title, body, href, metadata)
  values (
    new.buyer_id,
    'buyer',
    'order_updated',
    'Actualización de tu pedido',
    format('Tu pedido ahora está: %s', new.status),
    '/profile/sales',
    jsonb_build_object('order_id', new.id, 'status', new.status)
  );

  return new;
end;
$$;

create or replace function public.notify_seller_order_item_sold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
begin
  select o.seller_id into v_seller_id
  from public.order o
  where o.id = new.order_id;

  if v_seller_id is null then
    return new;
  end if;

  insert into public.notification (user_id, audience, type, title, body, href, metadata)
  values (
    v_seller_id,
    'vendor',
    'sale_created',
    format('Vendiste %s x%s', new.title_snapshot, new.quantity),
    'Nuevo ítem vendido en tu tienda.',
    '/dashboard-vendor/ventas',
    jsonb_build_object(
      'order_id', new.order_id,
      'order_item_id', new.id,
      'quantity', new.quantity
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_order_created on public.order;
create trigger trg_notify_order_created
  after insert on public.order
  for each row
  execute function public.notify_order_created();

drop trigger if exists trg_notify_order_status_changed on public.order;
create trigger trg_notify_order_status_changed
  after update of status on public.order
  for each row
  execute function public.notify_order_status_changed();

drop trigger if exists trg_notify_seller_order_item_sold on public.order_item;
create trigger trg_notify_seller_order_item_sold
  after insert on public.order_item
  for each row
  execute function public.notify_seller_order_item_sold();

-- Realtime: broadcast row changes to subscribed clients.
alter table public.notification replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notification'
  ) then
    alter publication supabase_realtime add table public.notification;
  end if;
end;
$$;
