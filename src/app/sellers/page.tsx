import Link from "next/link";
import { Header } from "@/components/Header";
import {
  getStorefrontProducts,
  getStorefrontSellers,
} from "@/lib/storefront";

export default async function SellersDirectoryPage() {
  const [sellers, products] = await Promise.all([
    getStorefrontSellers(),
    getStorefrontProducts(),
  ]);

  return (
    <main>
      <div className="catalog-top sellers-directory-top">
        <Header />
        <div className="catalog-hero">
          <p className="eyebrow">MakranMart sellers</p>
          <h1>Shop closer to home.</h1>
          <p>
            Discover verified shops, artisans and independent businesses from
            Balochistan and across Pakistan.
          </p>
        </div>
      </div>

      <section className="seller-directory">
        {sellers.map((seller) => {
          const count = products.filter(
            (product) => product.sellerSlug === seller.slug
          ).length;

          return (
            <Link
              href={`/seller/${seller.slug}`}
              className="seller-directory-card"
              key={seller.id}
            >
              <div className="seller-directory-avatar">
                {seller.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="seller-directory-title">
                <span>
                  {seller.verified ? "✓ Verified seller" : "MakranMart seller"}
                </span>
                <h2>{seller.name}</h2>
              </div>
              <p>
                {seller.description ||
                  "Browse products from this MakranMart seller."}
              </p>
              <div className="seller-directory-meta">
                <span>{seller.location || "Pakistan"}</span>
                <strong>{count} {count === 1 ? "product" : "products"} ↗</strong>
              </div>
            </Link>
          );
        })}

        {!sellers.length && (
          <div className="wishlist-empty seller-directory-empty">
            <span>▤</span>
            <h2>Sellers are being onboarded.</h2>
            <p>New local shops and artisans will appear here.</p>
            <Link href="/products" className="primary-cta">
              Browse products <span>↗</span>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
