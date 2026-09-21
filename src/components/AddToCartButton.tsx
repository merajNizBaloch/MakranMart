"use client";

import { useCart } from "@/components/CartProvider";
import type { Product } from "@/lib/catalog";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <button className="product-add-button" disabled={!product.stock} onClick={() => addItem(product)}>
      {product.stock ? "Add to cart" : "Sold out"} <span>{product.stock ? "+" : ""}</span>
    </button>
  );
}
