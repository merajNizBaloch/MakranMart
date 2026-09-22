-- Product System V2: richer merchandising, galleries and variant-level inventory.
alter table public.makranmart_products
  add column if not exists gallery_urls text[] not null default '{}'::text[],
  add column if not exists specifications jsonb not null default '{}'::jsonb,
  add column if not exists is_new boolean not null default false,
  add column if not exists is_bestseller boolean not null default false;

update public.makranmart_products
set gallery_urls = array[image_url]
where image_url is not null
  and cardinality(gallery_urls) = 0;

create table if not exists public.makranmart_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.makranmart_products(id) on delete cascade,
  name text not null,
  sku text,
  price integer check (price is null or price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint makranmart_product_variants_name_unique unique(product_id, name)
);

create unique index if not exists makranmart_product_variants_sku_unique
  on public.makranmart_product_variants(sku)
  where sku is not null and btrim(sku) <> '';

create index if not exists makranmart_product_variants_product_idx
  on public.makranmart_product_variants(product_id, sort_order);

alter table public.makranmart_product_variants enable row level security;

drop policy if exists "makranmart variants public read" on public.makranmart_product_variants;
create policy "makranmart variants public read"
  on public.makranmart_product_variants for select
  to anon, authenticated
  using (
    is_active
    and exists (
      select 1
      from public.makranmart_products product
      where product.id = makranmart_product_variants.product_id
        and product.is_active = true
    )
  );

drop policy if exists "makranmart admin variants all" on public.makranmart_product_variants;
create policy "makranmart admin variants all"
  on public.makranmart_product_variants for all
  to authenticated
  using (makranmart_private.is_admin())
  with check (makranmart_private.is_admin());

grant select on table public.makranmart_product_variants to anon, authenticated;
grant insert, update, delete on table public.makranmart_product_variants to authenticated;

alter table public.makranmart_order_items
  add column if not exists variant_id uuid references public.makranmart_product_variants(id) on delete set null,
  add column if not exists variant_name text,
  add column if not exists variant_sku text;

create index if not exists makranmart_order_items_variant_idx
  on public.makranmart_order_items(variant_id);

create or replace function public.makranmart_place_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_province text,
  p_items jsonb
)
returns table(order_number text, total integer, delivery_fee integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_total integer := 0;
  v_delivery_fee integer := 0;
  v_item jsonb;
  v_product public.makranmart_products%rowtype;
  v_variant public.makranmart_product_variants%rowtype;
  v_variant_id uuid;
  v_has_variants boolean;
  v_quantity integer;
  v_unit_price integer;
  v_rule public.makranmart_shipping_rules%rowtype;
begin
  if p_customer_name is null or btrim(p_customer_name) = ''
    or p_phone is null or btrim(p_phone) = ''
    or p_address is null or btrim(p_address) = ''
    or p_city is null or btrim(p_city) = ''
    or p_province is null or btrim(p_province) = '' then
    raise exception 'Missing delivery details';
  end if;

  if btrim(p_phone) !~ '^03[0-9]{9}$' then
    raise exception 'Invalid phone number';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0
    or jsonb_array_length(p_items) > 50 then
    raise exception 'Invalid cart';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if coalesce(v_item->>'slug', '') = '' then
      raise exception 'Invalid product';
    end if;

    v_quantity := greatest(1, least(20, coalesce((v_item->>'quantity')::integer, 0)));

    select * into v_product
    from public.makranmart_products
    where slug = v_item->>'slug' and is_active = true
    for update;

    if not found then raise exception 'Product unavailable'; end if;

    select exists(
      select 1 from public.makranmart_product_variants
      where product_id = v_product.id and is_active = true
    ) into v_has_variants;

    begin
      v_variant_id := nullif(v_item->>'variantId', '')::uuid;
    exception when invalid_text_representation then
      raise exception 'Invalid product option';
    end;

    if v_has_variants and v_variant_id is null then
      raise exception 'Choose a product option';
    end if;

    if v_variant_id is not null then
      select * into v_variant
      from public.makranmart_product_variants
      where id = v_variant_id
        and product_id = v_product.id
        and is_active = true
      for update;

      if not found then raise exception 'Product option unavailable'; end if;
      if v_variant.stock < v_quantity then
        raise exception 'Not enough stock for % - %', v_product.title, v_variant.name;
      end if;
      v_unit_price := coalesce(v_variant.price, v_product.price);
    else
      if v_product.stock < v_quantity then
        raise exception 'Not enough stock for %', v_product.title;
      end if;
      v_unit_price := v_product.price;
    end if;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

  select * into v_rule
  from public.makranmart_shipping_rules
  where region_key = case
    when lower(btrim(p_province)) = 'balochistan' then 'balochistan'
    else 'rest-pakistan'
  end
    and is_active = true
  limit 1;

  if not found then
    raise exception 'Delivery unavailable for selected region';
  end if;

  v_delivery_fee := v_rule.fee;
  if v_rule.free_threshold is not null and v_subtotal >= v_rule.free_threshold then
    v_delivery_fee := 0;
  end if;
  v_total := v_subtotal + v_delivery_fee;

  insert into public.makranmart_orders (
    customer_id, customer_name, phone, address, city, province,
    payment_method, status, subtotal, delivery_fee, total
  )
  values (
    auth.uid(), btrim(p_customer_name), btrim(p_phone), btrim(p_address), btrim(p_city), btrim(p_province),
    'cod', 'pending', v_subtotal, v_delivery_fee, v_total
  )
  returning id, makranmart_orders.order_number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, least(20, coalesce((v_item->>'quantity')::integer, 0)));
    select * into v_product
    from public.makranmart_products
    where slug = v_item->>'slug' and is_active = true
    for update;

    begin
      v_variant_id := nullif(v_item->>'variantId', '')::uuid;
    exception when invalid_text_representation then
      raise exception 'Invalid product option';
    end;

    if v_variant_id is not null then
      select * into v_variant
      from public.makranmart_product_variants
      where id = v_variant_id
        and product_id = v_product.id
        and is_active = true
      for update;

      if not found or v_variant.stock < v_quantity then
        raise exception 'Product option unavailable';
      end if;
      v_unit_price := coalesce(v_variant.price, v_product.price);
    else
      v_variant.id := null;
      v_variant.name := null;
      v_variant.sku := null;
      v_unit_price := v_product.price;
      if v_product.stock < v_quantity then
        raise exception 'Not enough stock for %', v_product.title;
      end if;
    end if;

    insert into public.makranmart_order_items (
      order_id, product_id, product_slug, title, unit_price, quantity,
      variant_id, variant_name, variant_sku
    )
    values (
      v_order_id, v_product.id, v_product.slug, v_product.title, v_unit_price, v_quantity,
      v_variant_id, v_variant.name, v_variant.sku
    );

    if v_variant_id is not null then
      update public.makranmart_product_variants
      set stock = stock - v_quantity,
          updated_at = now()
      where id = v_variant_id;
    else
      update public.makranmart_products
      set stock = stock - v_quantity,
          updated_at = now()
      where id = v_product.id;
    end if;
  end loop;

  return query select v_order_number, v_total, v_delivery_fee;
end;
$$;

revoke all on function public.makranmart_place_order(text,text,text,text,text,jsonb) from public;
grant execute on function public.makranmart_place_order(text,text,text,text,text,jsonb) to anon, authenticated;

create or replace function public.makranmart_update_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default null,
  p_customer_visible boolean default true
)
returns table(status text, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.makranmart_orders%rowtype;
  v_item record;
  v_stock integer;
  v_title text;
  v_variant_stock integer;
  v_variant_name text;
  v_now timestamptz := now();
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not makranmart_private.is_admin() then
    raise exception 'Forbidden';
  end if;

  if p_status is null or p_status <> all(array[
    'pending','confirmed','packed','shipped','delivered','cancelled'
  ]) then
    raise exception 'Invalid order status';
  end if;

  select * into v_order
  from public.makranmart_orders
  where id = p_order_id
  for update;

  if not found then raise exception 'Order not found'; end if;
  if v_note is not null and length(v_note) > 500 then
    raise exception 'Order note is too long';
  end if;

  if v_order.status <> p_status then
    if not (
      (v_order.status = 'pending' and p_status in ('confirmed','cancelled'))
      or (v_order.status = 'confirmed' and p_status in ('pending','packed','cancelled'))
      or (v_order.status = 'packed' and p_status in ('confirmed','shipped','cancelled'))
      or (v_order.status = 'shipped' and p_status in ('packed','delivered'))
      or (v_order.status = 'delivered' and p_status = 'shipped')
      or (v_order.status = 'cancelled' and p_status = 'pending')
    ) then
      raise exception 'That status transition is not allowed';
    end if;

    if p_status = 'cancelled' then
      if v_order.status not in ('pending','confirmed','packed') then
        raise exception 'Only unshipped orders can be cancelled';
      end if;

      for v_item in
        select product_id, variant_id, quantity
        from public.makranmart_order_items
        where order_id = p_order_id
      loop
        if v_item.variant_id is not null then
          update public.makranmart_product_variants
          set stock = stock + v_item.quantity,
              updated_at = v_now
          where id = v_item.variant_id;
        elsif v_item.product_id is not null then
          update public.makranmart_products
          set stock = stock + v_item.quantity,
              updated_at = v_now
          where id = v_item.product_id;
        end if;
      end loop;

      v_order.stock_released_at := v_now;
    elsif v_order.status = 'cancelled' and p_status = 'pending' then
      if v_order.stock_released_at is not null then
        for v_item in
          select product_id, variant_id, quantity, title, variant_name
          from public.makranmart_order_items
          where order_id = p_order_id
        loop
          if v_item.variant_id is not null then
            select stock, name into v_variant_stock, v_variant_name
            from public.makranmart_product_variants
            where id = v_item.variant_id
            for update;

            if not found then raise exception 'A product option from this order no longer exists'; end if;
            if v_variant_stock < v_item.quantity then
              raise exception 'Not enough stock to reactivate % - %', v_item.title, coalesce(v_variant_name, v_item.variant_name);
            end if;
          else
            if v_item.product_id is null then
              raise exception 'A product from this order no longer exists';
            end if;

            select stock, title into v_stock, v_title
            from public.makranmart_products
            where id = v_item.product_id
            for update;

            if not found then raise exception 'A product from this order no longer exists'; end if;
            if v_stock < v_item.quantity then
              raise exception 'Not enough stock to reactivate %', coalesce(v_title, v_item.title);
            end if;
          end if;
        end loop;

        for v_item in
          select product_id, variant_id, quantity
          from public.makranmart_order_items
          where order_id = p_order_id
        loop
          if v_item.variant_id is not null then
            update public.makranmart_product_variants
            set stock = stock - v_item.quantity,
                updated_at = v_now
            where id = v_item.variant_id;
          else
            update public.makranmart_products
            set stock = stock - v_item.quantity,
                updated_at = v_now
            where id = v_item.product_id;
          end if;
        end loop;
      end if;

      v_order.stock_released_at := null;
    end if;

    update public.makranmart_orders
    set status = p_status,
        stock_released_at = v_order.stock_released_at,
        updated_at = v_now
    where id = p_order_id;
  elsif v_note is null then
    return query select v_order.status, v_order.updated_at;
    return;
  else
    update public.makranmart_orders
    set updated_at = v_now
    where id = p_order_id;
  end if;

  insert into public.makranmart_order_events (
    order_id, actor_id, from_status, to_status, note, customer_visible, created_at
  )
  values (
    p_order_id, auth.uid(), v_order.status, p_status, v_note, p_customer_visible, v_now
  );

  return query select p_status, v_now;
end;
$$;

revoke all on function public.makranmart_update_order_status(uuid,text,text,boolean) from public;
grant execute on function public.makranmart_update_order_status(uuid,text,text,boolean) to authenticated;
