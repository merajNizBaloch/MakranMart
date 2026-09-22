"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product, ProductVariant } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog";

export type CartItem = Product & {
  quantity: number;
  cartKey: string;
  selectedVariant?: ProductVariant | null;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  addItem: (product: Product, variant?: ProductVariant | null) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function itemPrice(item: CartItem) {
  return item.selectedVariant?.price == null ? item.price : Number(item.selectedVariant.price);
}

function itemStock(item: CartItem) {
  return item.selectedVariant ? item.selectedVariant.stock : item.stock ?? 20;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("makranmart-cart");
      if (stored) {
        const parsed = JSON.parse(stored) as Array<Partial<CartItem> & Product>;
        // Restore device-local state after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(
          parsed.map((item) => ({
            ...item,
            quantity: Math.max(1, Number(item.quantity || 1)),
            cartKey: item.cartKey || `${item.slug}::${item.selectedVariant?.id || "base"}`,
          }))
        );
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("makranmart-cart", JSON.stringify(items));
  }, [items, ready]);

  const addItem = (product: Product, variant?: ProductVariant | null) => {
    if (product.variants?.length && !variant) return;

    const availableStock = variant ? variant.stock : product.stock || 0;
    if (!availableStock) return;

    const cartKey = `${product.slug}::${variant?.id || "base"}`;

    setItems((current) => {
      const existing = current.find((item) => item.cartKey === cartKey);
      if (existing) {
        return current.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: Math.min(item.quantity + 1, availableStock, 20) }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          cartKey,
          quantity: 1,
          selectedVariant: variant || null,
        },
      ];
    });

    setIsOpen(true);
  };

  const removeItem = (cartKey: string) =>
    setItems((current) => current.filter((item) => item.cartKey !== cartKey));

  const updateQuantity = (cartKey: string, quantity: number) => {
    if (quantity <= 0) return removeItem(cartKey);

    setItems((current) =>
      current.map((item) =>
        item.cartKey === cartKey
          ? { ...item, quantity: Math.min(quantity, itemStock(item), 20) }
          : item
      )
    );
  };

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + itemPrice(item) * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        isOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart: () => setItems([]),
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}

      <div
        className={`cart-backdrop ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside className={`cart-drawer ${isOpen ? "is-open" : ""}`} aria-label="Shopping cart">
        <div className="cart-drawer-head">
          <div>
            <span className="mini-label">Your bag</span>
            <h2>Cart <span>{count}</span></h2>
          </div>
          <button className="drawer-close" onClick={() => setIsOpen(false)} aria-label="Close cart">×</button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <span>MM</span>
              <h3>Your cart is empty</h3>
              <p>Add something you like and it will appear here.</p>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.cartKey}>
                <Link
                  href={`/product/${item.slug}`}
                  className={`cart-thumb ${item.visual}`}
                  style={item.imageUrl ? { backgroundImage: `url("${item.imageUrl}")` } : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  {!item.imageUrl && <span>MM</span>}
                </Link>
                <div className="cart-item-copy">
                  <Link href={`/product/${item.slug}`} onClick={() => setIsOpen(false)}>{item.title}</Link>
                  {item.selectedVariant && <small className="cart-variant">{item.selectedVariant.name}</small>}
                  <small>{formatPrice(itemPrice(item))}</small>
                  <div className="quantity-row">
                    <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}>+</button>
                    <button className="remove-item" onClick={() => removeItem(item.cartKey)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-drawer-foot">
          <div className="cart-total-row">
            <span>Subtotal</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <p>Delivery is calculated at checkout.</p>
          <Link
            href="/checkout"
            className={`checkout-button ${items.length === 0 ? "disabled" : ""}`}
            onClick={() => items.length > 0 && setIsOpen(false)}
          >
            Continue to checkout <span>↗</span>
          </Link>
        </div>
      </aside>
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
