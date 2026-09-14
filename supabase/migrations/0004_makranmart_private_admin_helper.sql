create schema if not exists makranmart_private;
revoke all on schema makranmart_private from public, anon;
grant usage on schema makranmart_private to authenticated;

create or replace function makranmart_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.makranmart_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function makranmart_private.is_admin() from public, anon;
grant execute on function makranmart_private.is_admin() to authenticated;

drop policy if exists "makranmart profiles read own" on public.makranmart_profiles;
create policy "makranmart profiles read own"
  on public.makranmart_profiles for select
  to authenticated
  using (id = auth.uid() or makranmart_private.is_admin());

drop policy if exists "makranmart profiles update own" on public.makranmart_profiles;
create policy "makranmart profiles update own"
  on public.makranmart_profiles for update
  to authenticated
  using (id = auth.uid() or makranmart_private.is_admin())
  with check (id = auth.uid() or makranmart_private.is_admin());

drop policy if exists "makranmart categories public read" on public.makranmart_categories;
create policy "makranmart categories public read"
  on public.makranmart_categories for select
  to anon, authenticated
  using (is_active);

drop policy if exists "makranmart sellers public read" on public.makranmart_sellers;
create policy "makranmart sellers public read"
  on public.makranmart_sellers for select
  to anon, authenticated
  using (is_active);

drop policy if exists "makranmart products public read" on public.makranmart_products;
create policy "makranmart products public read"
  on public.makranmart_products for select
  to anon, authenticated
  using (is_active);

drop policy if exists "makranmart orders customer read" on public.makranmart_orders;
create policy "makranmart orders customer read"
  on public.makranmart_orders for select
  to authenticated
  using (customer_id = auth.uid() or makranmart_private.is_admin());

drop policy if exists "makranmart order items customer read" on public.makranmart_order_items;
create policy "makranmart order items customer read"
  on public.makranmart_order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.makranmart_orders
      where public.makranmart_orders.id = makranmart_order_items.order_id
        and (
          public.makranmart_orders.customer_id = auth.uid()
          or makranmart_private.is_admin()
        )
    )
  );

drop policy if exists "makranmart admin categories all" on public.makranmart_categories;
create policy "makranmart admin categories all"
  on public.makranmart_categories for all
  to authenticated
  using (makranmart_private.is_admin())
  with check (makranmart_private.is_admin());

drop policy if exists "makranmart admin sellers all" on public.makranmart_sellers;
create policy "makranmart admin sellers all"
  on public.makranmart_sellers for all
  to authenticated
  using (makranmart_private.is_admin())
  with check (makranmart_private.is_admin());

drop policy if exists "makranmart admin products all" on public.makranmart_products;
create policy "makranmart admin products all"
  on public.makranmart_products for all
  to authenticated
  using (makranmart_private.is_admin())
  with check (makranmart_private.is_admin());

drop policy if exists "makranmart admin orders all" on public.makranmart_orders;
create policy "makranmart admin orders all"
  on public.makranmart_orders for all
  to authenticated
  using (makranmart_private.is_admin())
  with check (makranmart_private.is_admin());

drop policy if exists "makranmart admin order items all" on public.makranmart_order_items;
create policy "makranmart admin order items all"
  on public.makranmart_order_items for all
  to authenticated
  using (makranmart_private.is_admin())
  with check (makranmart_private.is_admin());

drop policy if exists "makranmart admins upload product images" on storage.objects;
create policy "makranmart admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'makranmart-products'
    and makranmart_private.is_admin()
  );

drop policy if exists "makranmart admins update product images" on storage.objects;
create policy "makranmart admins update product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'makranmart-products'
    and makranmart_private.is_admin()
  )
  with check (
    bucket_id = 'makranmart-products'
    and makranmart_private.is_admin()
  );

drop policy if exists "makranmart admins delete product images" on storage.objects;
create policy "makranmart admins delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'makranmart-products'
    and makranmart_private.is_admin()
  );

drop function if exists public.makranmart_is_admin();
drop function if exists public.makranmart_handle_new_user();
