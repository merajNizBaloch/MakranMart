import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { AddToCartButton } from "@/components/AddToCartButton";
import { WishlistButton } from "@/components/WishlistButton";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice } from "@/lib/catalog";
import { getStorefrontProducts } from "@/lib/storefront";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await getStorefrontProducts();
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  const related = products
    .filter((item) => item.slug !== product.slug && item.categorySlug === product.categorySlug)
    .slice(0, 4);

  return (
    <main>
      <Header />

      <section className="product-detail">
        <div
          className={`detail-visual ${product.visual} ${product.imageUrl ? "has-product-image" : ""}`}
          style={product.imageUrl ? { backgroundImage: `url("${product.imageUrl}")` } : undefined}
        >
          <span className="product-badge">{product.badge}</span>
          {!product.imageUrl && (
            <>
              <span className="detail-ring ring-one" />
              <span className="detail-ring ring-two" />
              <span className="detail-mark">MM</span>
            </>
          )}
        </div>

        <div className="detail-copy">
          <div className="product-breadcrumb">
            <Link href="/products">Shop</Link>
            <span>/</span>
            <Link href={`/category/${product.categorySlug}`}>{product.category}</Link>
          </div>

          <h1>{product.title}</h1>

          <div className="detail-price-row">
            <p className="detail-price">{formatPrice(product.price)}</p>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <del>{formatPrice(product.compareAtPrice)}</del>
            )}
          </div>

          <p className="detail-description">{product.description}</p>

          <p className="store-product-note">Sold and fulfilled by MakranMart</p>

          <div className="product-primary-actions">
            <AddToCartButton product={product} />
            <WishlistButton productId={product.id} large />
          </div>

          <div className="detail-meta">
            <div><span>Availability</span><strong>{product.stock ?? 0} in stock</strong></div>
            <div><span>Delivery</span><strong>Calculated by province at checkout</strong></div>
            <div><span>Payment</span><strong>Cash on delivery ready</strong></div>
            <div><span>Support</span><strong>MakranMart customer support</strong></div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-wrap related-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">You may also like</p>
              <h2>More from {product.category}</h2>
            </div>
          </div>
          <div className="product-grid">
            {related.map((item) => <ProductCard key={item.slug} product={item} />)}
          </div>
        </section>
      )}
    </main>
  );
}
