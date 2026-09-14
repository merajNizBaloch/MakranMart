# MakranMart

A modern shopping marketplace for Balochistan and Pakistan.

## Current features

- Animated storefront and floating category navigation
- Database-backed product catalog, categories and product details
- Real product image uploads through Supabase Storage
- Persistent shopping cart
- Customer wishlist with saved-product hearts
- Public seller storefront pages
- Instant product search suggestions
- Search by product, seller, city, description or SKU
- Category, price and sorting filters
- Province-based delivery estimates
- Admin-editable shipping fees, free-delivery thresholds and ETA ranges
- Cash-on-delivery checkout
- Transactional stock-safe order creation
- Customer sign in / sign up
- Customer account page with order history and wishlist count
- Protected MakranMart admin dashboard
- One-time first-admin bootstrap
- Product creation and editing
- Seller onboarding and management
- Seller private contact data isolated from public storefront data
- Category creation, ordering and visibility management
- Stock and visibility controls
- Featured products, sale pricing and SKU support
- Deep order management with customer/address details
- Stock-safe cancellation and cancelled-order reactivation
- Customer-visible order timelines and admin notes
- Printable order invoices
- WhatsApp customer contact from order pages
- Sales analytics, status overview and top-product reporting
- Order status controls
- Row Level Security across all MakranMart tables
- Shared Supabase project with strict `makranmart_` namespacing

## Supabase

MakranMart uses the existing TechCraft Supabase project currently named `realstate-os`.

MakranMart data is isolated with namespaced objects including:

- `makranmart_profiles`
- `makranmart_categories`
- `makranmart_sellers`
- `makranmart_seller_private`
- `makranmart_products`
- `makranmart_wishlist`
- `makranmart_shipping_rules`
- `makranmart_orders`
- `makranmart_order_items`
- `makranmart_order_events`
- `makranmart_place_order(...)`
- Storage bucket: `makranmart-products`

Seller phone, WhatsApp, email, contact-person and internal notes are stored in the admin-only `makranmart_seller_private` table rather than the public seller table.

## Default shipping rules

The seeded starting values are editable from `/admin/shipping`:

- Balochistan: Rs. 200; free from Rs. 5,000; estimated 2–5 days
- Rest of Pakistan: Rs. 300; free from Rs. 7,000; estimated 3–7 days

The server recalculates the delivery fee during order creation, so the checkout preview cannot override the final charge.

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
- `/products` searchable catalog
- `/category/[slug]` categories
- `/product/[slug]` product details
- `/sellers` public seller directory
- `/seller/[slug]` public seller store
- `/wishlist` saved products
- `/checkout` checkout with live delivery estimate
- `/login` sign in / sign up
- `/account` customer account and order history
- `/account/orders/[id]` customer order tracking and printable invoice
- `/admin` operations dashboard and sales analytics
- `/admin/orders` searchable order management
- `/admin/orders/[id]` order details, invoice, WhatsApp contact and timeline
- `/admin/products/new` create products
- `/admin/products/[id]/edit` edit products
- `/admin/sellers` seller management
- `/admin/categories` category management
- `/admin/shipping` delivery rules
