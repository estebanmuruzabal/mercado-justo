-- Checkout fulfillment: create shipments atomically with orders and enrich sync trigger.

create policy "Authenticated users can view vendor fulfillment settings"
  on public.vendor_fulfillment_settings
  for select
  using (auth.uid() is not null);

create or replace function public.fulfillment_delivery_method_from_code(p_method_code text)
returns text
language sql
immutable
set search_path = public
as $$
  select case coalesce(p_method_code, 'pickup_seller')
    when 'delivery_dittovan' then 'mj_delivery'
    when 'delivery_seller' then 'own_delivery'
    else 'pickup'
  end
$$;

create or replace function public.sync_fulfillment_request_from_shipment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_vendor_id uuid;
  v_pickup_address text;
  v_delivery_address text;
  v_method_code text;
  v_pickup_window_id uuid;
begin
  select o.buyer_id, new.store_id, st.address
    into v_buyer_id, v_vendor_id, v_pickup_address
  from public."order" o
  join public.store st on st.id = new.store_id
  where o.id = new.order_id;

  if v_buyer_id is null or v_vendor_id is null then
    return new;
  end if;

  v_method_code := coalesce(
    nullif(new.scheduled_window->>'method_code', ''),
    public.fulfillment_method_code_from_delivery_method(new.delivery_method)
  );

  v_delivery_address := nullif(new.scheduled_window->>'delivery_address', '');
  v_pickup_address := coalesce(
    nullif(new.scheduled_window->>'pickup_address', ''),
    v_pickup_address
  );

  v_pickup_window_id := nullif(new.scheduled_window->>'window_id', '')::uuid;

  if v_pickup_window_id is not null and v_method_code like 'delivery_%' then
    v_pickup_window_id := null;
  end if;

  if v_pickup_window_id is null and new.scheduled_window is not null and v_method_code like 'pickup_%' then
    select pw.id
      into v_pickup_window_id
    from public.pickup_windows pw
    where pw.is_active = true
      and pw.start_time = nullif(new.scheduled_window->>'start', '')::time
      and pw.end_time = nullif(new.scheduled_window->>'end', '')::time
    order by pw.sort_order
    limit 1;
  end if;

  insert into public.fulfillment_requests (
    shipment_id,
    order_id,
    vendor_id,
    buyer_id,
    method_code,
    status,
    pickup_window_id,
    scheduled_window,
    pickup_address,
    delivery_address,
    assigned_operator_id,
    batch_id,
    notes,
    created_at,
    updated_at
  ) values (
    new.id,
    new.order_id,
    v_vendor_id,
    v_buyer_id,
    v_method_code,
    new.status,
    v_pickup_window_id,
    new.scheduled_window,
    v_pickup_address,
    v_delivery_address,
    null,
    new.batch_id,
    null,
    new.created_at,
    now()
  )
  on conflict (shipment_id) do update set
    order_id = excluded.order_id,
    vendor_id = excluded.vendor_id,
    buyer_id = excluded.buyer_id,
    method_code = excluded.method_code,
    status = excluded.status,
    pickup_window_id = excluded.pickup_window_id,
    scheduled_window = excluded.scheduled_window,
    pickup_address = excluded.pickup_address,
    delivery_address = excluded.delivery_address,
    batch_id = excluded.batch_id,
    created_at = excluded.created_at,
    updated_at = now();

  return new;
end;
$$;

create or replace function public.create_orders_from_cart(
  p_buyer_id uuid,
  p_lines jsonb,
  p_fulfillments jsonb default '[]'::jsonb
)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lines jsonb := coalesce(p_lines, '[]'::jsonb);
  v_fulfillments jsonb := coalesce(p_fulfillments, '[]'::jsonb);
  v_seller_id uuid;
  v_order_id uuid;
  v_order_ids uuid[] := array[]::uuid[];
  v_subtotal numeric;
  v_line record;
  v_stock_after integer;
  v_fulfillment jsonb;
  v_method_code text;
  v_delivery_method text;
  v_scheduled_window jsonb;
begin
  if auth.uid() is distinct from p_buyer_id then
    raise exception 'Unauthorized';
  end if;

  if jsonb_typeof(v_lines) <> 'array' or jsonb_array_length(v_lines) = 0 then
    raise exception 'Cart is empty.';
  end if;

  for v_seller_id in
    select distinct l.store_id
    from jsonb_to_recordset(v_lines) as line(
      listing_id uuid,
      variant_id uuid,
      quantity integer
    )
    join public.listing l on l.id = line.listing_id
    join public.listing_variant lv on lv.id = line.variant_id and lv.listing_id = line.listing_id
  loop
    if v_seller_id = p_buyer_id then
      raise exception 'No podés comprar tus propios productos.';
    end if;

    select coalesce(sum(line.quantity * line.unit_price), 0)
    into v_subtotal
    from jsonb_to_recordset(v_lines) as line(
      listing_id uuid,
      variant_id uuid,
      quantity integer,
      unit_price numeric
    )
    join public.listing l on l.id = line.listing_id
    join public.listing_variant lv on lv.id = line.variant_id and lv.listing_id = line.listing_id
    where l.store_id = v_seller_id;

    insert into public."order" (
      buyer_id,
      seller_id,
      status,
      payment_status,
      subtotal,
      delivery_price,
      total
    )
    values (
      p_buyer_id,
      v_seller_id,
      'pending',
      'unpaid',
      v_subtotal,
      0,
      v_subtotal
    )
    returning id into v_order_id;

    v_order_ids := array_append(v_order_ids, v_order_id);

    for v_line in
      select
        line.listing_id,
        line.variant_id,
        line.quantity,
        line.unit_price,
        line.title_snapshot,
        line.variant_snapshot,
        l.title as listing_title
      from jsonb_to_recordset(v_lines) as line(
        listing_id uuid,
        variant_id uuid,
        quantity integer,
        unit_price numeric,
        title_snapshot text,
        variant_snapshot jsonb
      )
      join public.listing l on l.id = line.listing_id
      join public.listing_variant lv on lv.id = line.variant_id and lv.listing_id = line.listing_id
      where l.store_id = v_seller_id
    loop
      update public.listing_variant lv
      set stock = lv.stock - v_line.quantity
      where lv.id = v_line.variant_id
        and lv.stock >= v_line.quantity
      returning lv.stock into v_stock_after;

      if not found then
        raise exception 'Stock insuficiente para %.', coalesce(v_line.title_snapshot, v_line.listing_title, v_line.variant_id::text);
      end if;

      insert into public.order_item (
        order_id,
        listing_id,
        variant_id,
        quantity,
        title_snapshot,
        variant_snapshot,
        price_snapshot
      )
      values (
        v_order_id,
        v_line.listing_id,
        v_line.variant_id,
        v_line.quantity,
        v_line.title_snapshot,
        coalesce(v_line.variant_snapshot, '{}'::jsonb),
        v_line.unit_price
      );
    end loop;

    select elem
      into v_fulfillment
    from jsonb_array_elements(v_fulfillments) elem
    where (elem->>'vendor_id')::uuid = v_seller_id
    limit 1;

    if v_fulfillment is null then
      raise exception 'Falta configuración de fulfillment para el vendedor %.', v_seller_id;
    end if;

    v_method_code := v_fulfillment->>'method_code';
    v_delivery_method := public.fulfillment_delivery_method_from_code(v_method_code);

    v_scheduled_window := jsonb_build_object(
      'date', v_fulfillment->>'scheduled_date',
      'start', substring(coalesce(v_fulfillment->>'start_time', ''), 1, 5),
      'end', substring(coalesce(v_fulfillment->>'end_time', ''), 1, 5),
      'window_id', v_fulfillment->>'window_id',
      'method_code', v_method_code,
      'delivery_address', v_fulfillment->>'delivery_address',
      'pickup_address', v_fulfillment->>'pickup_address'
    );

    insert into public.shipment (
      order_id,
      store_id,
      status,
      delivery_method,
      scheduled_window,
      sequence
    )
    values (
      v_order_id,
      v_seller_id,
      'pending',
      v_delivery_method,
      v_scheduled_window,
      1
    );
  end loop;

  if array_length(v_order_ids, 1) is null then
    raise exception 'No se pudo crear la orden.';
  end if;

  return v_order_ids;
end;
$$;
