"use client";

import { useCart } from "@/components/CartProvider";
import type { Product } from "@/lib/catalog";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <button className="product-add-button" onClick={() => addItem(product)}>
      Add to cart <span>+</span>
    </button>
  );
}
