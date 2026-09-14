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
  v_quantity integer;
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
    if v_product.stock < v_quantity then
      raise exception 'Not enough stock for %', v_product.title;
    end if;
    v_subtotal := v_subtotal + (v_product.price * v_quantity);
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
    if v_product.stock < v_quantity then
      raise exception 'Not enough stock for %', v_product.title;
    end if;

    insert into public.makranmart_order_items (
      order_id, product_id, product_slug, title, unit_price, quantity
    )
    values (
      v_order_id, v_product.id, v_product.slug, v_product.title, v_product.price, v_quantity
    );

    update public.makranmart_products
    set stock = stock - v_quantity, updated_at = now()
    where id = v_product.id;
  end loop;

  return query select v_order_number, v_total, v_delivery_fee;
end;
$$;

revoke all on function public.makranmart_place_order(text,text,text,text,text,jsonb) from public;
grant execute on function public.makranmart_place_order(text,text,text,text,text,jsonb) to anon, authenticated;
