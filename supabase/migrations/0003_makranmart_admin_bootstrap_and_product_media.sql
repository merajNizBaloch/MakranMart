alter table public.makranmart_products
  add column if not exists image_url text,
  add column if not exists sku text,
  add column if not exists compare_at_price integer,
  add column if not exists is_featured boolean not null default false;

create unique index if not exists makranmart_products_sku_unique
  on public.makranmart_products(sku)
  where sku is not null;

alter table public.makranmart_products
  drop constraint if exists makranmart_products_compare_at_price_check;

alter table public.makranmart_products
  add constraint makranmart_products_compare_at_price_check
  check (compare_at_price is null or compare_at_price >= 0);

drop trigger if exists makranmart_on_auth_user_created on auth.users;

create or replace function public.makranmart_claim_initial_admin()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1 from public.makranmart_profiles
    where role = 'admin'
  ) then
    return false;
  end if;

  select coalesce(raw_user_meta_data ->> 'full_name', '')
    into v_name
  from auth.users
  where id = v_user_id;

  insert into public.makranmart_profiles (id, full_name, role)
  values (v_user_id, coalesce(v_name, ''), 'admin')
  on conflict (id) do update
    set role = 'admin',
        full_name = case
          when coalesce(public.makranmart_profiles.full_name, '') = '' then excluded.full_name
          else public.makranmart_profiles.full_name
        end,
        updated_at = now();

  return true;
end;
$$;

revoke all on function public.makranmart_claim_initial_admin() from public, anon;
grant execute on function public.makranmart_claim_initial_admin() to authenticated;

revoke all on function public.makranmart_handle_new_user() from public, anon, authenticated;
revoke all on function public.makranmart_is_admin() from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'makranmart-products',
  'makranmart-products',
  true,
  4194304,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "makranmart product images public read" on storage.objects;
create policy "makranmart product images public read"
  on storage.objects for select
  to public
  using (bucket_id = 'makranmart-products');

drop policy if exists "makranmart admins upload product images" on storage.objects;
create policy "makranmart admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'makranmart-products'
    and public.makranmart_is_admin()
  );

drop policy if exists "makranmart admins update product images" on storage.objects;
create policy "makranmart admins update product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'makranmart-products'
    and public.makranmart_is_admin()
  )
  with check (
    bucket_id = 'makranmart-products'
    and public.makranmart_is_admin()
  );

drop policy if exists "makranmart admins delete product images" on storage.objects;
create policy "makranmart admins delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'makranmart-products'
    and public.makranmart_is_admin()
  );
