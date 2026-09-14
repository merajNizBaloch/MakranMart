"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/catalog";

type OrderResult = {
  orderNumber: string;
  total: number;
};

export default function CheckoutPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || submitting) return;

    setError("");
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.get("customerName"),
        phone: form.get("phone"),
        address: form.get("address"),
        city: form.get("city"),
        province: form.get("province"),
        items: items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
      }),
    });

    const result = await response.json().catch(() => null);
    setSubmitting(false);

    if (!response.ok) {
      setError(result?.error || "We could not place your order. Please try again.");
      return;
    }

    setOrder({ orderNumber: result.orderNumber, total: result.total });
    clearCart();
  }

  if (order) {
    return (
      <main>
        <Header />
        <section className="order-success">
          <span className="success-mark">✓</span>
          <p className="eyebrow">Order confirmed</p>
          <h1>Thank you. We received your order.</h1>
          <p>
            Your order number is <strong>{order.orderNumber}</strong>. The order total is{" "}
            <strong>{formatPrice(order.total)}</strong>.
          </p>
          <div className="order-success-actions">
            <Link href="/products" className="primary-cta">Continue shopping <span>↗</span></Link>
            <Link href="/" className="secondary-cta">Back to home</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <section className="checkout-shell">
        <div className="checkout-main">
          <p className="eyebrow">Secure checkout</p>
          <h1>Where should we send it?</h1>

          <form className="checkout-form" onSubmit={submitOrder}>
            <div className="form-grid">
              <label>Full name<input name="customerName" type="text" placeholder="Your full name" required /></label>
              <label>Phone number<input name="phone" type="tel" placeholder="03XX XXXXXXX" required /></label>
            </div>
            <label>Delivery address<input name="address" type="text" placeholder="House, street, area" required /></label>
            <div className="form-grid">
              <label>City<input name="city" type="text" placeholder="Panjgur" required /></label>
              <label>Province
                <select name="province" defaultValue="Balochistan">
                  <option>Balochistan</option><option>Sindh</option><option>Punjab</option><option>Khyber Pakhtunkhwa</option><option>Islamabad</option><option>Gilgit-Baltistan</option><option>Azad Kashmir</option>
                </select>
              </label>
            </div>
            <label className="payment-option">
              <input type="radio" name="payment" defaultChecked />
              <span><strong>Cash on delivery</strong><small>Pay when your order arrives.</small></span>
            </label>
            <button className="place-order-button" type="submit" disabled={items.length === 0 || submitting}>
              {submitting ? "Placing order…" : "Place order"} <span>↗</span>
            </button>
            {error && <p className="checkout-error">{error}</p>}
            <p className="checkout-demo-note">Prices are validated by the server before an order is created.</p>
          </form>
        </div>

        <aside className="order-summary">
          <div className="order-summary-head">
            <span>Order summary</span>
            <Link href="/products">Continue shopping</Link>
          </div>

          <div className="summary-items">
            {items.length === 0 ? (
              <div className="summary-empty"><p>Your cart is empty.</p><Link href="/products">Browse products →</Link></div>
            ) : items.map((item) => (
              <div className="summary-item" key={item.slug}>
                <div
                  className={`summary-thumb ${item.visual}`}
                  style={item.imageUrl ? { backgroundImage: `url("${item.imageUrl}")` } : undefined}
                >
                  {!item.imageUrl && <span>MM</span>}
                </div>
                <div className="summary-copy">
                  <strong>{item.title}</strong>
                  <small>{formatPrice(item.price)}</small>
                  <div className="summary-actions">
                    <button type="button" onClick={() => updateQuantity(item.slug, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.slug, item.quantity + 1)}>+</button>
                    <button type="button" onClick={() => removeItem(item.slug)}>×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="summary-total">
            <div><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>
            <div><span>Delivery</span><strong>Calculated later</strong></div>
            <div className="summary-grand"><span>Total</span><strong>{formatPrice(total)}</strong></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
