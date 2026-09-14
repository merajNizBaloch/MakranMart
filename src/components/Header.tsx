"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useWishlist } from "@/components/WishlistProvider";

export function Header({ light = false }: { light?: boolean }) {
  const { count, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();

  return (
    <nav className={`nav-wrap site-nav ${light ? "nav-light" : ""}`}>
      <Link href="/" className="brand" aria-label="MakranMart home">
        <span className="brand-mark">M</span>
        <span>MakranMart</span>
      </Link>

      <div className="nav-links">
        <Link href="/products">Shop</Link>
        <Link href="/category/balochi-crafts">Local finds</Link>
        <Link href="/sellers">Sellers</Link>
      </div>

      <div className="nav-actions">
        <Link href="/products" className="icon-button search-link" aria-label="Search products">⌕</Link>
        <Link href="/wishlist" className="wishlist-nav" aria-label="Wishlist">
          ♡ <span>{wishlistCount}</span>
        </Link>
        <Link href="/account" className="account-button">Account</Link>
        <button className="cart-button" onClick={openCart}>
          Cart <span className="cart-count">{count}</span>
        </button>
      </div>
    </nav>
  );
}
