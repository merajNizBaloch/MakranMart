# MakranMart

MakranMart is a single-store shop for the startup, built with Next.js, React and Supabase. Products are sold and fulfilled by MakranMart. Legacy seller URLs redirect to the shop; seller-management endpoints are retired.

## Shopping

- Product search, category and price filters, sorting and wishlist.
- Product detail pages, stock-aware cart and cash-on-delivery checkout.
- Customer accounts, order tracking and delivery timelines.
- Province-based delivery rules.

## Store administration

Open `/admin/login`. First-time setup uses **Activate owner access**, an email, password and the private one-time owner activation code delivered separately. Select **Create a new account** if needed. If email confirmation is required, confirm it and return to activate the existing account with the code.

After activation, sign in with email and password. The code is consumed permanently. No public customer can claim ownership without it. There is no password embedded in the repository. The dashboard has products, image uploads, prices, stock, visibility, featured items, categories, orders, invoices, status changes, shipping and password changes.

## Development

```bash
npm install
npm run dev
```

The existing Supabase project is retained. Override `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to use a different project. Never place a service-role key in a NEXT_PUBLIC variable.

Apply migrations in order for a new database. The single-store migration preserves order history and archives former merchant records. Owner setup requires an administrator to provision a cryptographically random code's SHA-256 hash in the private owner_setup table; raw codes must never be committed. The connected database is already configured.

## Checks

```bash
npm run build
npm run lint
npx playwright test --config tests/playwright.config.ts
```

GitHub Actions builds the application and tests the shopping controls and unauthenticated admin protection on desktop and mobile. Database activation checks cover invalid/null codes, valid activation, code reuse, and denied legacy claim/secret-table access.
