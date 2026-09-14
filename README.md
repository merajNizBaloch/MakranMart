# MakranMart

A modern shopping marketplace for Balochistan and Pakistan.

## Current features

- Animated storefront and floating category navigation
- Database-backed product catalog, categories and product details
- Real product image uploads through Supabase Storage
- Persistent shopping cart
- Cash-on-delivery checkout
- Transactional stock-safe order creation
- Customer sign in / sign up
- Customer account page with order history
- Protected MakranMart admin dashboard
- One-time first-admin bootstrap
- Product creation and editing
- Seller onboarding and management
- Category creation, ordering and visibility management
- Product search by title, seller, city, description or SKU
- Category, price and sort filters
- Stock and visibility controls
- Featured products, sale pricing and SKU support
- Order status controls
- Row Level Security across all MakranMart tables
- Shared Supabase project with strict `makranmart_` namespacing

## Supabase

MakranMart uses the existing TechCraft Supabase project currently named `realstate-os`.

MakranMart data is isolated with namespaced objects:

- `makranmart_profiles`
- `makranmart_categories`
- `makranmart_sellers`
- `makranmart_products`
- `makranmart_orders`
- `makranmart_order_items`
- `makranmart_place_order(...)`
- Storage bucket: `makranmart-products`

No existing Realstate-OS, DineCore, PharmaFlow, Resumly, LinkCraft, MartEdge or other app tables are reused or modified.

## Local setup

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Admin setup

1. Create or sign in to a MakranMart account.
2. Open `/admin`.
3. If no MakranMart admin exists yet, use **Make this account the first admin**.
4. The one-time claim automatically becomes unavailable after the first admin is created.

## Main routes

- `/` storefront
- `/products` catalog
- `/category/[slug]` categories
- `/product/[slug]` product details
- `/checkout` checkout
- `/login` sign in / sign up
- `/account` customer account and order history
- `/admin` operations dashboard
- `/admin/products/new` create products
- `/admin/products/[id]/edit` edit products
- `/admin/sellers` seller management
- `/admin/categories` category management
