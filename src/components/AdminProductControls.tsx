"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminProductControls({
  productId,
  stock,
  active,
}: {
  productId: string;
  stock: number;
  active: boolean;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(stock);
  const [isActive, setIsActive] = useState(active);
  const [saving, setSaving] = useState(false);

  async function save(nextStock = quantity, nextActive = isActive) {
    setSaving(true);
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: nextStock, isActive: nextActive }),
    });
    setSaving(false);
    if (response.ok) router.refresh();
  }

  return (
    <div className="inventory-controls">
      <div className="stock-stepper">
        <button
          onClick={() => {
            const next = Math.max(0, quantity - 1);
            setQuantity(next);
            void save(next, isActive);
          }}
          disabled={saving}
        >−</button>
        <span>{quantity}</span>
        <button
          onClick={() => {
            const next = quantity + 1;
            setQuantity(next);
            void save(next, isActive);
          }}
          disabled={saving}
        >+</button>
      </div>
      <button
        className={`visibility-toggle ${isActive ? "active" : ""}`}
        onClick={() => {
          const next = !isActive;
          setIsActive(next);
          void save(quantity, next);
        }}
        disabled={saving}
      >
        {isActive ? "Live" : "Hidden"}
      </button>
    </div>
  );
}
