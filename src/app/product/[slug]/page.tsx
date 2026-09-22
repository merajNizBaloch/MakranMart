import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { AddToCartButton } from "@/components/AddToCartButton";
import { WishlistButton } from "@/components/WishlistButton";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { formatPrice, productDisplayPrice } from "@/lib/catalog";
import { getStorefrontProducts } from "@/lib/storefront";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const products = await getStorefrontProducts();
  const product = products.find((item) => item.slug === slug);

  if (!product) return {};

  const image = product.imageUrls?.[0] || product.imageUrl || undefined;

  return {
    title: `${product.title} | MakranMart`,
    description: product.description || `Shop ${product.title} from MakranMart.`,
    openGraph: {
      title: product.title,
      description: product.description || `Shop ${product.title} from MakranMart.`,
      images: image ? [image] : undefined,
      type: "website",
    },
  };
}

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

  const images = product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  const specifications = Object.entries(product.specifications || {});
  const displayPrice = productDisplayPrice(product);
  const hasVariants = Boolean(product.variants?.length);

  return (
    <main>
      <Header />

      <section className="product-detail">
        <ProductGallery
          images={images}
          title={product.title}
          visual={product.visual}
          badge={!product.stock ? "Sold out" : product.isNew ? "New arrival" : product.isBestseller ? "Best seller" : product.badge}
        />

        <div className="detail-copy">
          <div className="product-breadcrumb">
            <Link href="/products">Shop</Link>
            <span>/</span>
            <Link href={`/category/${product.categorySlug}`}>{product.category}</Link>
          </div>

          <h1>{product.title}</h1>

          <div className="detail-price-row">
            <p className="detail-price">
              {hasVariants && displayPrice !== product.price ? "From " : ""}
              {formatPrice(displayPrice)}
            </p>
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
            <div>
              <span>Availability</span>
              <strong>{product.stock ? `${product.stock} available` : "Out of stock"}</strong>
            </div>
            <div><span>Delivery</span><strong>Calculated by province at checkout</strong></div>
            <div><span>Payment</span><strong>Cash on delivery</strong></div>
            <div><span>Support</span><strong>MakranMart customer support</strong></div>
          </div>
        </div>
      </section>

      {specifications.length > 0 && (
        <section className="section-wrap product-spec-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Product details</p>
              <h2>Specifications</h2>
            </div>
          </div>
          <div className="product-spec-grid">
            {specifications.map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

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
