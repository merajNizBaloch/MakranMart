drop policy if exists "makranmart customer order events read" on public.makranmart_order_events;

create or replace function public.makranmart_my_order_events(p_order_id uuid)
returns table(
  id uuid,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.makranmart_orders orders
    where orders.id = p_order_id
      and orders.customer_id = auth.uid()
  ) then
    raise exception 'Order not found';
  end if;

  return query
  select
    events.id,
    events.from_status,
    events.to_status,
    case when events.customer_visible then events.note else null end,
    events.created_at
  from public.makranmart_order_events events
  where events.order_id = p_order_id
    and (
      events.from_status is distinct from events.to_status
      or events.customer_visible
    )
  order by events.created_at;
end;
$$;

revoke all on function public.makranmart_my_order_events(uuid) from public;
grant execute on function public.makranmart_my_order_events(uuid) to authenticated;
