alter table public.makranmart_sellers
  add column if not exists contact_name text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.makranmart_categories
  add column if not exists description text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists makranmart_categories_sort_order_idx
  on public.makranmart_categories(sort_order, name);

create index if not exists makranmart_sellers_active_name_idx
  on public.makranmart_sellers(is_active, name);
