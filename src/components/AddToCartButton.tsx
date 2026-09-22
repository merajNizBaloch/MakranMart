"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const variants = useMemo(() => product.variants || [], [product.variants]);
  const [selectedId, setSelectedId] = useState(variants.length === 1 ? variants[0].id : "");

  const selected = useMemo(
    () => variants.find((variant) => variant.id === selectedId) || null,
    [variants, selectedId]
  );

  const available = selected ? selected.stock > 0 : !variants.length && Boolean(product.stock);
  const price = selected?.price == null ? product.price : Number(selected.price);

  return (
    <div className="purchase-panel">
      {variants.length > 0 && (
        <div className="variant-selector">
          <div className="variant-selector-head">
            <span>Choose an option</span>
            {selected && <strong>{formatPrice(price)}</strong>}
          </div>
          <div className="variant-options" role="radiogroup" aria-label="Product options">
            {variants.map((variant) => (
              <button
                type="button"
                key={variant.id}
                className={`variant-option ${selectedId === variant.id ? "is-selected" : ""}`}
                onClick={() => setSelectedId(variant.id)}
                disabled={!variant.stock}
                aria-pressed={selectedId === variant.id}
              >
                <strong>{variant.name}</strong>
                <small>{variant.stock ? `${variant.stock} available` : "Sold out"}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        className="product-add-button"
        disabled={!available}
        onClick={() => addItem(product, selected)}
      >
        {variants.length && !selected
          ? "Choose an option"
          : available
            ? "Add to cart"
            : "Sold out"}{" "}
        <span>{available ? "+" : ""}</span>
      </button>
    </div>
  );
}
