"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog";

type CartItem = Product & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("makranmart-cart");
      // Restore device-local state after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setItems(JSON.parse(stored));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("makranmart-cart", JSON.stringify(items));
  }, [items, ready]);

  const addItem = (product: Product) => {
    if (!product.stock) return;
    setItems((current) => {
      const existing = current.find((item) => item.slug === product.slug);
      if (existing) {
        return current.map((item) =>
          item.slug === product.slug ? { ...item, quantity: Math.min(item.quantity + 1, product.stock ?? 20, 20) } : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (slug: string) =>
    setItems((current) => current.filter((item) => item.slug !== slug));

  const updateQuantity = (slug: string, quantity: number) => {
    if (quantity <= 0) return removeItem(slug);
    setItems((current) =>
      current.map((item) => (item.slug === slug ? { ...item, quantity: Math.min(quantity, item.stock ?? 20, 20) } : item))
    );
  };

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
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
              <div className="cart-item" key={item.slug}>
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
                  <small>{formatPrice(item.price)}</small>
                  <div className="quantity-row">
                    <button onClick={() => updateQuantity(item.slug, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.slug, item.quantity + 1)}>+</button>
                    <button className="remove-item" onClick={() => removeItem(item.slug)}>Remove</button>
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
          <Link href="/checkout" className={`checkout-button ${items.length === 0 ? "disabled" : ""}`} onClick={() => items.length > 0 && setIsOpen(false)}>
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
