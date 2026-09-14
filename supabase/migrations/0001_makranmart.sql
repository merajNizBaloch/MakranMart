create extension if not exists pgcrypto;

create table if not exists public.makranmart_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.makranmart_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.makranmart_sellers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  slug text unique not null,
  location text,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.makranmart_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.makranmart_sellers(id) on delete set null,
  category_id uuid references public.makranmart_categories(id) on delete set null,
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

create table if not exists public.makranmart_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default (
    'MM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  ),
  customer_id uuid references auth.users(id) on delete set null,
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

create table if not exists public.makranmart_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.makranmart_orders(id) on delete cascade,
  product_id uuid references public.makranmart_products(id) on delete set null,
  product_slug text not null,
  title text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer generated always as (unit_price * quantity) stored
);

create index if not exists makranmart_products_category_id_idx on public.makranmart_products(category_id);
create index if not exists makranmart_products_seller_id_idx on public.makranmart_products(seller_id);
create index if not exists makranmart_orders_customer_id_idx on public.makranmart_orders(customer_id);
create index if not exists makranmart_orders_created_at_idx on public.makranmart_orders(created_at desc);
create index if not exists makranmart_order_items_order_id_idx on public.makranmart_order_items(order_id);

create or replace function public.makranmart_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.makranmart_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists makranmart_on_auth_user_created on auth.users;
create trigger makranmart_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.makranmart_handle_new_user();

create or replace function public.makranmart_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.makranmart_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.makranmart_profiles enable row level security;
alter table public.makranmart_categories enable row level security;
alter table public.makranmart_sellers enable row level security;
alter table public.makranmart_products enable row level security;
alter table public.makranmart_orders enable row level security;
alter table public.makranmart_order_items enable row level security;

drop policy if exists "makranmart profiles read own" on public.makranmart_profiles;
create policy "makranmart profiles read own"
  on public.makranmart_profiles for select
  to authenticated
  using (id = auth.uid() or public.makranmart_is_admin());

drop policy if exists "makranmart profiles update own" on public.makranmart_profiles;
create policy "makranmart profiles update own"
  on public.makranmart_profiles for update
  to authenticated
  using (id = auth.uid() or public.makranmart_is_admin())
  with check (id = auth.uid() or public.makranmart_is_admin());

drop policy if exists "makranmart categories public read" on public.makranmart_categories;
create policy "makranmart categories public read"
  on public.makranmart_categories for select
  to anon, authenticated
  using (is_active or public.makranmart_is_admin());

drop policy if exists "makranmart sellers public read" on public.makranmart_sellers;
create policy "makranmart sellers public read"
  on public.makranmart_sellers for select
  to anon, authenticated
  using (is_active or public.makranmart_is_admin());

drop policy if exists "makranmart products public read" on public.makranmart_products;
create policy "makranmart products public read"
  on public.makranmart_products for select
  to anon, authenticated
  using (is_active or public.makranmart_is_admin());

drop policy if exists "makranmart orders customer read" on public.makranmart_orders;
create policy "makranmart orders customer read"
  on public.makranmart_orders for select
  to authenticated
  using (customer_id = auth.uid() or public.makranmart_is_admin());

drop policy if exists "makranmart order items customer read" on public.makranmart_order_items;
create policy "makranmart order items customer read"
  on public.makranmart_order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.makranmart_orders
      where public.makranmart_orders.id = makranmart_order_items.order_id
      and (public.makranmart_orders.customer_id = auth.uid() or public.makranmart_is_admin())
    )
  );

drop policy if exists "makranmart admin categories all" on public.makranmart_categories;
create policy "makranmart admin categories all"
  on public.makranmart_categories for all
  to authenticated
  using (public.makranmart_is_admin())
  with check (public.makranmart_is_admin());

drop policy if exists "makranmart admin sellers all" on public.makranmart_sellers;
create policy "makranmart admin sellers all"
  on public.makranmart_sellers for all
  to authenticated
  using (public.makranmart_is_admin())
  with check (public.makranmart_is_admin());

drop policy if exists "makranmart admin products all" on public.makranmart_products;
create policy "makranmart admin products all"
  on public.makranmart_products for all
  to authenticated
  using (public.makranmart_is_admin())
  with check (public.makranmart_is_admin());

drop policy if exists "makranmart admin orders all" on public.makranmart_orders;
create policy "makranmart admin orders all"
  on public.makranmart_orders for all
  to authenticated
  using (public.makranmart_is_admin())
  with check (public.makranmart_is_admin());

drop policy if exists "makranmart admin order items all" on public.makranmart_order_items;
create policy "makranmart admin order items all"
  on public.makranmart_order_items for all
  to authenticated
  using (public.makranmart_is_admin())
  with check (public.makranmart_is_admin());

insert into public.makranmart_categories (slug, name)
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

insert into public.makranmart_sellers (name, slug, location, is_verified)
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

insert into public.makranmart_products (seller_id, category_id, slug, title, description, price, stock, badge, visual)
values
  ((select id from public.makranmart_sellers where slug='makran-craft-house'), (select id from public.makranmart_categories where slug='balochi-crafts'), 'handcrafted-balochi-tote', 'Handcrafted Balochi Tote', 'A statement tote inspired by traditional Balochi craft, designed for everyday use.', 2490, 18, 'Made in Balochistan', 'visual-craft'),
  ((select id from public.makranmart_sellers where slug='digital-hub'), (select id from public.makranmart_categories where slug='electronics'), 'wireless-earbuds-pro', 'Wireless Earbuds Pro', 'Compact wireless earbuds with clear calls, touch controls and all-day battery life.', 4250, 25, 'Popular', 'visual-tech'),
  ((select id from public.makranmart_sellers where slug='sahil-wear'), (select id from public.makranmart_categories where slug='fashion'), 'everyday-linen-kurta', 'Everyday Linen Kurta', 'A breathable linen kurta with a clean silhouette for daily wear and warm weather.', 3190, 14, 'New', 'visual-fashion'),
  ((select id from public.makranmart_sellers where slug='ghar-studio'), (select id from public.makranmart_categories where slug='home-living'), 'minimal-table-lamp', 'Minimal Table Lamp', 'Warm ambient lighting in a compact modern form for desks, bedsides and reading corners.', 2850, 11, 'Home pick', 'visual-home'),
  ((select id from public.makranmart_sellers where slug='panjgur-handmade'), (select id from public.makranmart_categories where slug='balochi-crafts'), 'embroidered-wallet', 'Embroidered Wallet', 'A compact wallet finished with colorful geometric embroidery and practical inner pockets.', 1290, 30, 'Local favorite', 'visual-craft-alt'),
  ((select id from public.makranmart_sellers where slug='makran-mobile-center'), (select id from public.makranmart_categories where slug='mobiles'), 'power-bank-20000', '20,000mAh Power Bank', 'High-capacity portable charging with dual outputs for travel, work and daily use.', 5490, 20, 'Fast charge', 'visual-mobile'),
  ((select id from public.makranmart_sellers where slug='active-pakistan'), (select id from public.makranmart_categories where slug='sports'), 'classic-running-shoes', 'Classic Running Shoes', 'Lightweight trainers with cushioned support for walking, running and daily wear.', 3890, 16, 'Everyday sport', 'visual-sport'),
  ((select id from public.makranmart_sellers where slug='makran-foods'), (select id from public.makranmart_categories where slug='groceries'), 'premium-dates-box', 'Premium Dates Box', 'A carefully packed selection of naturally sweet dates for gifting and everyday snacking.', 1650, 40, 'Fresh stock', 'visual-grocery')
on conflict (slug) do update set
  seller_id = excluded.seller_id,
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  badge = excluded.badge,
  visual = excluded.visual,
  updated_at = now();

create or replace function public.makranmart_place_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_province text,
  p_items jsonb
)
returns table(order_number text, total integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_total integer := 0;
  v_item jsonb;
  v_product public.makranmart_products%rowtype;
  v_quantity integer;
begin
  if p_customer_name is null or btrim(p_customer_name) = ''
    or p_phone is null or btrim(p_phone) = ''
    or p_address is null or btrim(p_address) = ''
    or p_city is null or btrim(p_city) = ''
    or p_province is null or btrim(p_province) = '' then
    raise exception 'Missing delivery details';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, least(20, coalesce((v_item->>'quantity')::integer, 0)));

    select *
      into v_product
    from public.makranmart_products
    where slug = v_item->>'slug'
      and is_active = true
    for update;

    if not found then
      raise exception 'Product unavailable';
    end if;

    if v_product.stock < v_quantity then
      raise exception 'Not enough stock for %', v_product.title;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  v_total := v_subtotal;

  insert into public.makranmart_orders (
    customer_id, customer_name, phone, address, city, province,
    payment_method, status, subtotal, delivery_fee, total
  )
  values (
    auth.uid(), btrim(p_customer_name), btrim(p_phone), btrim(p_address), btrim(p_city), btrim(p_province),
    'cod', 'pending', v_subtotal, 0, v_total
  )
  returning id, makranmart_orders.order_number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, least(20, coalesce((v_item->>'quantity')::integer, 0)));

    select *
      into v_product
    from public.makranmart_products
    where slug = v_item->>'slug'
      and is_active = true
    for update;

    insert into public.makranmart_order_items (
      order_id, product_id, product_slug, title, unit_price, quantity
    )
    values (
      v_order_id, v_product.id, v_product.slug, v_product.title, v_product.price, v_quantity
    );

    update public.makranmart_products
    set stock = stock - v_quantity,
        updated_at = now()
    where id = v_product.id;
  end loop;

  return query select v_order_number, v_total;
end;
$$;

revoke all on function public.makranmart_place_order(text,text,text,text,text,jsonb) from public;
grant execute on function public.makranmart_place_order(text,text,text,text,text,jsonb) to anon, authenticated;
