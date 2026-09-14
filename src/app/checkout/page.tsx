"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/catalog";

type OrderResult = {
  orderNumber: string;
  total: number;
  deliveryFee: number;
};

type ShippingEstimate = {
  available: boolean;
  fee: number;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  freeThreshold: number | null;
};

export default function CheckoutPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const [province, setProvince] = useState("Balochistan");
  const [shipping, setShipping] = useState<ShippingEstimate>({
    available: true,
    fee: 0,
    etaMinDays: null,
    etaMaxDays: null,
    freeThreshold: null,
  });
  const [shippingLoading, setShippingLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);

  useEffect(() => {
    let active = true;

    async function estimate() {
      setShippingLoading(true);

      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ province, subtotal: total }),
      });

      const result = await response.json().catch(() => null);
      if (!active) return;

      setShippingLoading(false);

      if (response.ok && result) {
        setShipping({
          available: result.available !== false,
          fee: Number(result.fee || 0),
          etaMinDays: result.etaMinDays == null ? null : Number(result.etaMinDays),
          etaMaxDays: result.etaMaxDays == null ? null : Number(result.etaMaxDays),
          freeThreshold: result.freeThreshold == null ? null : Number(result.freeThreshold),
        });
      }
    }

    void estimate();

    return () => {
      active = false;
    };
  }, [province, total]);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || submitting || !shipping.available) return;

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

    setOrder({
      orderNumber: result.orderNumber,
      total: Number(result.total),
      deliveryFee: Number(result.deliveryFee || 0),
    });
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
            Your order number is <strong>{order.orderNumber}</strong>. The final total is{" "}
            <strong>{formatPrice(order.total)}</strong>
            {order.deliveryFee > 0
              ? " including " + formatPrice(order.deliveryFee) + " delivery."
              : " with free delivery."}
          </p>
          <div className="order-success-actions">
            <Link href="/products" className="primary-cta">Continue shopping <span>↗</span></Link>
            <Link href="/" className="secondary-cta">Back to home</Link>
          </div>
        </section>
      </main>
    );
  }

  const estimatedTotal = total + shipping.fee;

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
                <select
                  name="province"
                  value={province}
                  onChange={(event) => setProvince(event.target.value)}
                >
                  <option>Balochistan</option>
                  <option>Sindh</option>
                  <option>Punjab</option>
                  <option>Khyber Pakhtunkhwa</option>
                  <option>Islamabad</option>
                  <option>Gilgit-Baltistan</option>
                  <option>Azad Kashmir</option>
                </select>
              </label>
            </div>

            <div className="shipping-estimate-card">
              <div>
                <span>Delivery estimate</span>
                <strong>
                  {shippingLoading
                    ? "Calculating…"
                    : !shipping.available
                      ? "Unavailable"
                      : shipping.etaMinDays != null && shipping.etaMaxDays != null
                        ? shipping.etaMinDays + "–" + shipping.etaMaxDays + " days"
                        : "Shown after checkout"}
                </strong>
              </div>
              <div>
                <span>Delivery fee</span>
                <strong>
                  {shippingLoading
                    ? "…"
                    : !shipping.available
                      ? "Unavailable"
                      : shipping.fee === 0
                        ? "Free"
                        : formatPrice(shipping.fee)}
                </strong>
              </div>
              {shipping.available && shipping.freeThreshold && total < shipping.freeThreshold && (
                <p>
                  Add {formatPrice(shipping.freeThreshold - total)} more for free delivery in this zone.
                </p>
              )}
            </div>

            <label className="payment-option">
              <input type="radio" name="payment" defaultChecked />
              <span><strong>Cash on delivery</strong><small>Pay when your order arrives.</small></span>
            </label>

            {!shipping.available && (
              <p className="checkout-error">Delivery is currently unavailable for this region.</p>
            )}

            <button className="place-order-button" type="submit" disabled={items.length === 0 || submitting || shippingLoading || !shipping.available}>
              {submitting ? "Placing order…" : "Place order"} <span>↗</span>
            </button>

            {error && <p className="checkout-error">{error}</p>}
            <p className="checkout-demo-note">
              Product prices, stock and delivery charges are validated again by the server before the order is created.
            </p>
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
            <div>
              <span>Delivery</span>
              <strong>{shippingLoading ? "…" : !shipping.available ? "Unavailable" : shipping.fee === 0 ? "Free" : formatPrice(shipping.fee)}</strong>
            </div>
            <div className="summary-grand"><span>Total</span><strong>{formatPrice(estimatedTotal)}</strong></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
