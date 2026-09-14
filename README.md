# MakranMart

A modern shopping marketplace for Balochistan and Pakistan.

## Current features

- Animated storefront and floating category navigation
- Product catalog, category pages and product details
- Persistent cart drawer
- Cash-on-delivery checkout
- Supabase customer authentication
- Supabase-backed products and inventory
- Secure server-side order creation
- Admin dashboard for orders and inventory
- Order status controls
- Product stock and visibility controls
- Row Level Security migration with seeded starter catalog

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Supabase setup

Create a dedicated Supabase project for MakranMart, then add these values to `.env.local` and the deployment environment:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Apply `supabase/migrations/0001_makranmart.sql` to create the database tables, security policies and starter catalog.

After creating your first account, set that profile's `role` to `admin` from the Supabase dashboard to enable `/admin`.

## Main routes

- `/` storefront
- `/products` catalog
- `/category/[slug]` category browsing
- `/product/[slug]` product details
- `/checkout` checkout
- `/login` account sign in / sign up
- `/admin` protected admin dashboard
