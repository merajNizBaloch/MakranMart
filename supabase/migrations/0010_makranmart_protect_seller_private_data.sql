create table if not exists public.makranmart_seller_private (
  seller_id uuid primary key references public.makranmart_sellers(id) on delete cascade,
  contact_name text,
  phone text,
  whatsapp text,
  email text,
  notes text,
  updated_at timestamptz not null default now()
);

insert into public.makranmart_seller_private
  (seller_id, contact_name, phone, whatsapp, email, notes, updated_at)
select
  id, contact_name, phone, whatsapp, email, notes, now()
from public.makranmart_sellers
on conflict (seller_id) do update set
  contact_name = excluded.contact_name,
  phone = excluded.phone,
  whatsapp = excluded.whatsapp,
  email = excluded.email,
  notes = excluded.notes,
  updated_at = now();

alter table public.makranmart_seller_private enable row level security;

drop policy if exists "makranmart admin seller private all" on public.makranmart_seller_private;
create policy "makranmart admin seller private all"
  on public.makranmart_seller_private for all
  to authenticated
  using (makranmart_private.is_admin())
  with check (makranmart_private.is_admin());

grant select, insert, update, delete on table public.makranmart_seller_private to authenticated;
revoke all on table public.makranmart_seller_private from anon;

alter table public.makranmart_sellers
  drop column if exists contact_name,
  drop column if exists phone,
  drop column if exists whatsapp,
  drop column if exists email,
  drop column if exists notes;
