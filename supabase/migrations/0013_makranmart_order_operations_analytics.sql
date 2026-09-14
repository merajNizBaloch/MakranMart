alter table public.makranmart_orders
  add column if not exists stock_released_at timestamptz;

create table if not exists public.makranmart_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.makranmart_orders(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  from_status text,
  to_status text not null,
  note text,
  customer_visible boolean not null default true,
  created_at timestamptz not null default now(),
  constraint makranmart_order_events_status_check check (
    to_status = any (array['pending','confirmed','packed','shipped','delivered','cancelled'])
    and (from_status is null or from_status = any (array['pending','confirmed','packed','shipped','delivered','cancelled']))
  )
);

create index if not exists makranmart_order_events_order_created_idx
  on public.makranmart_order_events(order_id, created_at);

alter table public.makranmart_order_events enable row level security;

drop policy if exists "makranmart admin order events all" on public.makranmart_order_events;
create policy "makranmart admin order events all"
  on public.makranmart_order_events for all
  to authenticated
  using (makranmart_private.is_admin())
  with check (makranmart_private.is_admin());

drop policy if exists "makranmart customer order events read" on public.makranmart_order_events;
create policy "makranmart customer order events read"
  on public.makranmart_order_events for select
  to authenticated
  using (
    customer_visible
    and exists (
      select 1
      from public.makranmart_orders orders
      where orders.id = makranmart_order_events.order_id
        and orders.customer_id = auth.uid()
    )
  );

grant select on table public.makranmart_order_events to authenticated;

create or replace function makranmart_private.log_order_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.makranmart_order_events (
    order_id, actor_id, from_status, to_status, note, customer_visible, created_at
  )
  values (
    new.id, new.customer_id, null, new.status, 'Order placed', true, new.created_at
  );
  return new;
end;
$$;

drop trigger if exists makranmart_log_order_created on public.makranmart_orders;
create trigger makranmart_log_order_created
after insert on public.makranmart_orders
for each row execute function makranmart_private.log_order_created();

insert into public.makranmart_order_events (
  order_id, actor_id, from_status, to_status, note, customer_visible, created_at
)
select
  orders.id,
  orders.customer_id,
  null,
  orders.status,
  'Order history started',
  true,
  orders.created_at
from public.makranmart_orders orders
where not exists (
  select 1
  from public.makranmart_order_events events
  where events.order_id = orders.id
);

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

  select *
    into v_order
  from public.makranmart_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

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
        select product_id, quantity
        from public.makranmart_order_items
        where order_id = p_order_id
      loop
        if v_item.product_id is not null then
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
          select product_id, quantity, title
          from public.makranmart_order_items
          where order_id = p_order_id
        loop
          if v_item.product_id is null then
            raise exception 'A product from this order no longer exists';
          end if;

          select stock, title
            into v_stock, v_title
          from public.makranmart_products
          where id = v_item.product_id
          for update;

          if not found then
            raise exception 'A product from this order no longer exists';
          end if;

          if v_stock < v_item.quantity then
            raise exception 'Not enough stock to reactivate %', coalesce(v_title, v_item.title);
          end if;
        end loop;

        for v_item in
          select product_id, quantity
          from public.makranmart_order_items
          where order_id = p_order_id
        loop
          update public.makranmart_products
          set stock = stock - v_item.quantity,
              updated_at = v_now
          where id = v_item.product_id;
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
    order_id,
    actor_id,
    from_status,
    to_status,
    note,
    customer_visible,
    created_at
  )
  values (
    p_order_id,
    auth.uid(),
    v_order.status,
    p_status,
    v_note,
    p_customer_visible,
    v_now
  );

  return query
  select p_status, v_now;
end;
$$;

revoke all on function public.makranmart_update_order_status(uuid,text,text,boolean) from public;
grant execute on function public.makranmart_update_order_status(uuid,text,text,boolean) to authenticated;

create or replace function public.makranmart_admin_sales_analytics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not makranmart_private.is_admin() then
    raise exception 'Forbidden';
  end if;

  select jsonb_build_object(
    'totalOrders', (select count(*) from public.makranmart_orders),
    'activeOrders', (
      select count(*)
      from public.makranmart_orders
      where status not in ('delivered','cancelled')
    ),
    'deliveredOrders', (
      select count(*)
      from public.makranmart_orders
      where status = 'delivered'
    ),
    'cancelledOrders', (
      select count(*)
      from public.makranmart_orders
      where status = 'cancelled'
    ),
    'grossOrderValue', (
      select coalesce(sum(total), 0)
      from public.makranmart_orders
      where status <> 'cancelled'
    ),
    'deliveredRevenue', (
      select coalesce(sum(total), 0)
      from public.makranmart_orders
      where status = 'delivered'
    ),
    'last30DaysValue', (
      select coalesce(sum(total), 0)
      from public.makranmart_orders
      where status <> 'cancelled'
        and created_at >= now() - interval '30 days'
    ),
    'averageOrderValue', (
      select coalesce(round(avg(total)), 0)
      from public.makranmart_orders
      where status <> 'cancelled'
    ),
    'unitsOrdered', (
      select coalesce(sum(items.quantity), 0)
      from public.makranmart_order_items items
      join public.makranmart_orders orders on orders.id = items.order_id
      where orders.status <> 'cancelled'
    ),
    'statusCounts', coalesce((
      select jsonb_object_agg(status, count)
      from (
        select status, count(*)::int as count
        from public.makranmart_orders
        group by status
      ) status_rows
    ), '{}'::jsonb),
    'topProducts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'slug', product_slug,
          'title', title,
          'quantity', quantity,
          'value', value
        )
        order by value desc, quantity desc
      )
      from (
        select
          items.product_slug,
          max(items.title) as title,
          sum(items.quantity)::int as quantity,
          sum(items.unit_price * items.quantity)::int as value
        from public.makranmart_order_items items
        join public.makranmart_orders orders on orders.id = items.order_id
        where orders.status <> 'cancelled'
        group by items.product_slug
        order by value desc, quantity desc
        limit 5
      ) top_rows
    ), '[]'::jsonb),
    'dailySales', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', sales_day,
          'orders', order_count,
          'value', order_value
        )
        order by sales_day
      )
      from (
        select
          created_at::date as sales_day,
          count(*)::int as order_count,
          sum(total)::int as order_value
        from public.makranmart_orders
        where status <> 'cancelled'
          and created_at >= current_date - interval '13 days'
        group by created_at::date
        order by sales_day
      ) daily_rows
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.makranmart_admin_sales_analytics() from public;
grant execute on function public.makranmart_admin_sales_analytics() to authenticated;
