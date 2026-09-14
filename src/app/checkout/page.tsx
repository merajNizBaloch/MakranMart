"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/catalog";

export default function CheckoutPage() {
  const { items, total, updateQuantity, removeItem } = useCart();

  return (
    <main>
      <Header />
      <section className="checkout-shell">
        <div className="checkout-main">
          <p className="eyebrow">Secure checkout</p>
          <h1>Where should we send it?</h1>

          <form className="checkout-form" onSubmit={(event) => event.preventDefault()}>
            <div className="form-grid">
              <label>Full name<input type="text" placeholder="Your full name" /></label>
              <label>Phone number<input type="tel" placeholder="03XX XXXXXXX" /></label>
            </div>
            <label>Delivery address<input type="text" placeholder="House, street, area" /></label>
            <div className="form-grid">
              <label>City<input type="text" placeholder="Panjgur" /></label>
              <label>Province
                <select defaultValue="Balochistan">
                  <option>Balochistan</option><option>Sindh</option><option>Punjab</option><option>Khyber Pakhtunkhwa</option><option>Islamabad</option><option>Gilgit-Baltistan</option><option>Azad Kashmir</option>
                </select>
              </label>
            </div>
            <label className="payment-option">
              <input type="radio" name="payment" defaultChecked />
              <span><strong>Cash on delivery</strong><small>Pay when your order arrives.</small></span>
            </label>
            <button className="place-order-button" type="submit" disabled={items.length === 0}>Place order <span>↗</span></button>
            <p className="checkout-demo-note">Order processing will be connected to the MakranMart database in the next backend stage.</p>
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
                <div className={`summary-thumb ${item.visual}`}><span>MM</span></div>
                <div className="summary-copy">
                  <strong>{item.title}</strong>
                  <small>{formatPrice(item.price)}</small>
                  <div className="summary-actions">
                    <button onClick={() => updateQuantity(item.slug, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.slug, item.quantity + 1)}>+</button>
                    <button onClick={() => removeItem(item.slug)}>×</button>
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
