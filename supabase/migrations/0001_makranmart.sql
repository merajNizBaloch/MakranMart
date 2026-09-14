create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text unique not null,
  location text,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.sellers(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  slug text unique not null,
  title text not null,
  description text,
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  badge text,
  visual text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default (
    'MM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  ),
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  province text not null,
  payment_method text not null default 'cod' check (payment_method in ('cod')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_slug text not null,
  title text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer generated always as (unit_price * quantity) stored
);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_seller_id_idx on public.products(seller_id);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.sellers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "categories public read" on public.categories;
create policy "categories public read"
  on public.categories for select
  to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "sellers public read" on public.sellers;
create policy "sellers public read"
  on public.sellers for select
  to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "products public read" on public.products;
create policy "products public read"
  on public.products for select
  to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "orders customer read" on public.orders;
create policy "orders customer read"
  on public.orders for select
  to authenticated
  using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "order items customer read" on public.order_items;
create policy "order items customer read"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where public.orders.id = order_items.order_id
      and (public.orders.customer_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "admin profiles all" on public.profiles;
create policy "admin profiles all"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin categories all" on public.categories;
create policy "admin categories all"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin sellers all" on public.sellers;
create policy "admin sellers all"
  on public.sellers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin products all" on public.products;
create policy "admin products all"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin orders all" on public.orders;
create policy "admin orders all"
  on public.orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin order items all" on public.order_items;
create policy "admin order items all"
  on public.order_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.categories (slug, name)
values
  ('balochi-crafts', 'Balochi Crafts'),
  ('fashion', 'Fashion'),
  ('mobiles', 'Mobiles'),
  ('electronics', 'Electronics'),
  ('home-living', 'Home & Living'),
  ('beauty', 'Beauty'),
  ('groceries', 'Groceries'),
  ('books', 'Books'),
  ('sports', 'Sports'),
  ('automotive', 'Automotive')
on conflict (slug) do update set name = excluded.name;

insert into public.sellers (name, slug, location, is_verified)
values
  ('Makran Craft House', 'makran-craft-house', 'Turbat, Balochistan', true),
  ('Digital Hub', 'digital-hub', 'Quetta, Balochistan', true),
  ('Sahil Wear', 'sahil-wear', 'Gwadar, Balochistan', true),
  ('Ghar Studio', 'ghar-studio', 'Karachi, Sindh', true),
  ('Panjgur Handmade', 'panjgur-handmade', 'Panjgur, Balochistan', true),
  ('Makran Mobile Center', 'makran-mobile-center', 'Turbat, Balochistan', true),
  ('Active Pakistan', 'active-pakistan', 'Lahore, Punjab', true),
  ('Makran Foods', 'makran-foods', 'Panjgur, Balochistan', true)
on conflict (slug) do update set
  name = excluded.name,
  location = excluded.location,
  is_verified = excluded.is_verified;

insert into public.products (seller_id, category_id, slug, title, description, price, stock, badge, visual)
values
  ((select id from public.sellers where slug='makran-craft-house'), (select id from public.categories where slug='balochi-crafts'), 'handcrafted-balochi-tote', 'Handcrafted Balochi Tote', 'A statement tote inspired by traditional Balochi craft, designed for everyday use.', 2490, 18, 'Made in Balochistan', 'visual-craft'),
  ((select id from public.sellers where slug='digital-hub'), (select id from public.categories where slug='electronics'), 'wireless-earbuds-pro', 'Wireless Earbuds Pro', 'Compact wireless earbuds with clear calls, touch controls and all-day battery life.', 4250, 25, 'Popular', 'visual-tech'),
  ((select id from public.sellers where slug='sahil-wear'), (select id from public.categories where slug='fashion'), 'everyday-linen-kurta', 'Everyday Linen Kurta', 'A breathable linen kurta with a clean silhouette for daily wear and warm weather.', 3190, 14, 'New', 'visual-fashion'),
  ((select id from public.sellers where slug='ghar-studio'), (select id from public.categories where slug='home-living'), 'minimal-table-lamp', 'Minimal Table Lamp', 'Warm ambient lighting in a compact modern form for desks, bedsides and reading corners.', 2850, 11, 'Home pick', 'visual-home'),
  ((select id from public.sellers where slug='panjgur-handmade'), (select id from public.categories where slug='balochi-crafts'), 'embroidered-wallet', 'Embroidered Wallet', 'A compact wallet finished with colorful geometric embroidery and practical inner pockets.', 1290, 30, 'Local favorite', 'visual-craft-alt'),
  ((select id from public.sellers where slug='makran-mobile-center'), (select id from public.categories where slug='mobiles'), 'power-bank-20000', '20,000mAh Power Bank', 'High-capacity portable charging with dual outputs for travel, work and daily use.', 5490, 20, 'Fast charge', 'visual-mobile'),
  ((select id from public.sellers where slug='active-pakistan'), (select id from public.categories where slug='sports'), 'classic-running-shoes', 'Classic Running Shoes', 'Lightweight trainers with cushioned support for walking, running and daily wear.', 3890, 16, 'Everyday sport', 'visual-sport'),
  ((select id from public.sellers where slug='makran-foods'), (select id from public.categories where slug='groceries'), 'premium-dates-box', 'Premium Dates Box', 'A carefully packed selection of naturally sweet dates for gifting and everyday snacking.', 1650, 40, 'Fresh stock', 'visual-grocery')
on conflict (slug) do update set
  seller_id = excluded.seller_id,
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  badge = excluded.badge,
  visual = excluded.visual,
  updated_at = now();
