-- Single-store conversion. Keep historical rows and order snapshots intact.
insert into public.makranmart_sellers (slug, name, location, is_active, is_verified, description)
values ('makranmart-store', 'MakranMart', 'Balochistan, Pakistan', true, true, 'The official MakranMart store.')
on conflict (slug) do update set name = excluded.name, is_active = true;

update public.makranmart_products
set seller_id = (select id from public.makranmart_sellers where slug = 'makranmart-store');
update public.makranmart_sellers set is_active = false where slug <> 'makranmart-store';

create or replace function makranmart_private.assign_store()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  select id into new.seller_id from public.makranmart_sellers where slug = 'makranmart-store';
  if new.seller_id is null then raise exception 'Store configuration unavailable'; end if;
  return new;
end;
$$;
revoke all on function makranmart_private.assign_store() from public, anon, authenticated;
drop trigger if exists makranmart_single_store on public.makranmart_products;
create trigger makranmart_single_store before insert or update of seller_id
on public.makranmart_products for each row execute function makranmart_private.assign_store();

-- Disable the old first-customer-can-claim-admin endpoint, including existing deployments.
create or replace function public.makranmart_claim_initial_admin()
returns boolean language sql security invoker set search_path = '' as $$ select false; $$;
revoke all on function public.makranmart_claim_initial_admin() from public, anon, authenticated;

create table if not exists makranmart_private.owner_setup (
  singleton boolean primary key default true check (singleton),
  token_hash text,
  claimed_by uuid,
  claimed_at timestamptz
);
alter table makranmart_private.owner_setup enable row level security;
revoke all on makranmart_private.owner_setup from public, anon, authenticated;

-- A definer is required for the one-time, code-authorized role promotion.
-- The secret hash is inaccessible to clients; activation locks and consumes it atomically.
create or replace function makranmart_private.activate_owner(p_setup_code text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_claimed timestamptz;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from auth.users where id = v_user and email_confirmed_at is not null)
    then raise exception 'Confirm your email first'; end if;
  select token_hash, claimed_at into v_hash, v_claimed
    from makranmart_private.owner_setup where singleton = true for update;
  if p_setup_code is null or v_hash is null or v_claimed is not null or length(p_setup_code) < 32
    or v_hash <> encode(sha256(convert_to(p_setup_code, 'UTF8')), 'hex')
    or exists (select 1 from public.makranmart_profiles where role = 'admin')
  then raise exception 'Invalid or used activation code'; end if;
  insert into public.makranmart_profiles (id, full_name, role)
  values (v_user, 'Store owner', 'admin')
  on conflict (id) do update set role = 'admin', updated_at = now();
  update makranmart_private.owner_setup
    set token_hash = null, claimed_by = v_user, claimed_at = now() where singleton = true;
  return true;
end;
$$;
revoke all on function makranmart_private.activate_owner(text) from public, anon;
grant execute on function makranmart_private.activate_owner(text) to authenticated;

create or replace function public.makranmart_activate_owner(p_setup_code text)
returns boolean language sql security invoker set search_path = '' as $$
  select makranmart_private.activate_owner(p_setup_code);
$$;
revoke all on function public.makranmart_activate_owner(text) from public, anon;
grant execute on function public.makranmart_activate_owner(text) to authenticated;
