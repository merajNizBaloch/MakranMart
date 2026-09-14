"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { WishlistButton } from "@/components/WishlistButton";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <article className="product-card">
      <div className={`product-visual ${product.visual}`}>
        {product.imageUrl ? (
          <div
            className="product-photo"
            style={{ backgroundImage: `url("${product.imageUrl}")` }}
            aria-hidden="true"
          />
        ) : (
          <>
            <span className="visual-shape visual-shape-one" />
            <span className="visual-shape visual-shape-two" />
            <span className="visual-center-mark">MM</span>
          </>
        )}

        <Link href={`/product/${product.slug}`} className="product-visual-link" aria-label={`View ${product.title}`} />
        <span className="product-badge">{product.badge}</span>
        <div className="card-wishlist"><WishlistButton productId={product.id} /></div>
        <button className="quick-add" onClick={() => addItem(product)} aria-label={`Add ${product.title} to cart`}>
          +
        </button>
      </div>

      <div className="product-info">
        <div>
          <Link href={`/category/${product.categorySlug}`} className="product-category">{product.category}</Link>
          <h3><Link href={`/product/${product.slug}`}>{product.title}</Link></h3>
          {product.sellerSlug ? (
            <Link className="product-seller-link" href={`/seller/${product.sellerSlug}`}>
              {product.seller}{product.sellerVerified ? " ✓" : ""}
            </Link>
          ) : (
            <span className="product-seller-link">{product.seller}</span>
          )}
        </div>

        <div className="product-price-stack">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <del>{formatPrice(product.compareAtPrice)}</del>
          )}
          <strong>{formatPrice(product.price)}</strong>
        </div>
      </div>
    </article>
  );
}
