"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <article className="product-card">
      <div className={`product-visual ${product.visual}`}>
        <Link href={`/product/${product.slug}`} className="product-visual-link" aria-label={`View ${product.title}`} />
        <span className="product-badge">{product.badge}</span>
        <span className="visual-shape visual-shape-one" />
        <span className="visual-shape visual-shape-two" />
        <span className="visual-center-mark">MM</span>
        <button className="quick-add" onClick={() => addItem(product)} aria-label={`Add ${product.title} to cart`}>
          +
        </button>
      </div>
      <div className="product-info">
        <div>
          <Link href={`/category/${product.categorySlug}`} className="product-category">{product.category}</Link>
          <h3><Link href={`/product/${product.slug}`}>{product.title}</Link></h3>
        </div>
        <strong>{formatPrice(product.price)}</strong>
      </div>
    </article>
  );
}
