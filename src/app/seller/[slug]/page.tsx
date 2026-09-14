import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import {
  getStorefrontProducts,
  getStorefrontSeller,
} from "@/lib/storefront";

export default async function SellerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [seller, products] = await Promise.all([
    getStorefrontSeller(slug),
    getStorefrontProducts(),
  ]);

  if (!seller) notFound();

  const sellerProducts = products.filter(
    (product) => product.sellerSlug === seller.slug
  );

  return (
    <main>
      <div className="seller-store-top">
        <Header />
        <section className="seller-store-hero">
          <div className="seller-store-avatar">{seller.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <div className="seller-store-label">
              <span>MakranMart seller</span>
              {seller.verified && <b>✓ Verified</b>}
            </div>
            <h1>{seller.name}</h1>
            <p>{seller.description || `Products from ${seller.location || "Pakistan"}.`}</p>
            <div className="seller-store-meta">
              <span>{seller.location || "Pakistan"}</span>
              <span>{sellerProducts.length} products</span>
            </div>
          </div>
        </section>
      </div>

      <section className="section-wrap seller-products-section">
        <div className="results-head">
          <span>Products by {seller.name}</span>
          <Link href="/products">Browse all products →</Link>
        </div>

        {sellerProducts.length ? (
          <div className="product-grid catalog-grid">
            {sellerProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="category-empty">
            <span>▤</span>
            <h2>No active products yet.</h2>
            <p>This seller is preparing new listings.</p>
          </div>
        )}
      </section>
    </main>
  );
}
