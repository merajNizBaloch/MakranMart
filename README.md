# MakranMart

A modern shopping marketplace for Balochistan and Pakistan.

## Current features

- Animated storefront and floating category navigation
- Product catalog, category pages and product details
- Persistent cart drawer
- Cash-on-delivery checkout
- Supabase customer authentication
- Database-backed products and live inventory
- Transactional server-side order creation
- Admin dashboard for orders and inventory
- Order status controls
- Product stock and visibility controls
- Row Level Security
- Seeded starter catalog

## Supabase

MakranMart uses the existing TechCraft Supabase project currently named `realstate-os`.

To keep MakranMart isolated from the other TechCraft apps in that shared project, every database object is namespaced with `makranmart_`, including:

- `makranmart_profiles`
- `makranmart_categories`
- `makranmart_sellers`
- `makranmart_products`
- `makranmart_orders`
- `makranmart_order_items`
- `makranmart_place_order(...)`

No existing Realstate-OS, DineCore, PharmaFlow, Resumly, LinkCraft, MartEdge or other tables are reused or modified.

The public project URL and publishable key are configured as safe fallbacks in the Supabase client files. They can still be overridden with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

No service-role key is required by the MakranMart application.

## Local setup

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Database migrations

The applied schema lives under `supabase/migrations/`.

## Admin access

Create or sign in to a MakranMart account first. Then set that user's row in `makranmart_profiles.role` to `admin` to enable `/admin`.

## Main routes

- `/` storefront
- `/products` catalog
- `/category/[slug]` category browsing
- `/product/[slug]` product details
- `/checkout` checkout
- `/login` account sign in / sign up
- `/admin` protected admin dashboard
