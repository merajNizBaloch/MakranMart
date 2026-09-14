"use client";

import { useWishlist } from "@/components/WishlistProvider";

export function WishlistButton({
  productId,
  large = false,
}: {
  productId?: string;
  large?: boolean;
}) {
  const { ids, loading, toggle } = useWishlist();
  const saved = Boolean(productId && ids.has(productId));

  return (
    <button
      type="button"
      className={`wishlist-button ${saved ? "saved" : ""} ${large ? "large" : ""}`}
      onClick={() => void toggle(productId)}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      title={saved ? "Remove from wishlist" : "Save to wishlist"}
      disabled={!productId || loading}
    >
      <span>{saved ? "♥" : "♡"}</span>
      {large && <strong>{saved ? "Saved" : "Save for later"}</strong>}
    </button>
  );
}
