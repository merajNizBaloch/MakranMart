import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice, products } from "@/lib/catalog";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  const related = products
    .filter((item) => item.slug !== product.slug && item.categorySlug === product.categorySlug)
    .slice(0, 4);

  return (
    <main>
      <Header />

      <section className="product-detail">
        <div className={`detail-visual ${product.visual}`}>
          <span className="product-badge">{product.badge}</span>
          <span className="detail-ring ring-one" />
          <span className="detail-ring ring-two" />
          <span className="detail-mark">MM</span>
        </div>

        <div className="detail-copy">
          <div className="product-breadcrumb">
            <Link href="/products">Shop</Link>
            <span>/</span>
            <Link href={`/category/${product.categorySlug}`}>{product.category}</Link>
          </div>

          <h1>{product.title}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <p className="detail-description">{product.description}</p>

          <div className="seller-note">
            <span className="seller-avatar">{product.seller.slice(0, 1)}</span>
            <div>
              <small>Sold by</small>
              <strong>{product.seller}</strong>
              <span>{product.location}</span>
            </div>
          </div>

          <AddToCartButton product={product} />

          <div className="detail-meta">
            <div><span>Delivery</span><strong>Across Pakistan</strong></div>
            <div><span>Payment</span><strong>Cash on delivery ready</strong></div>
            <div><span>Support</span><strong>Verified seller assistance</strong></div>
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
