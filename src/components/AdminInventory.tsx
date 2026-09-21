"use client";
import { useState } from "react";
import Link from "next/link";
import { AdminProductControls } from "@/components/AdminProductControls";
import { formatPrice } from "@/lib/catalog";
type Item = { id: string; title: string; sku: string | null; stock: number; price: number; is_active: boolean };
export function AdminInventory({ products }: { products: Item[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const items = products.filter(p => (p.title + " " + (p.sku || "")).toLowerCase().includes(query.toLowerCase()) && (filter === "all" || (filter === "low" && p.stock <= 5) || (filter === "hidden" && !p.is_active)));
  return <section className="admin-panel"><div className="inventory-filters"><label>Search products<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or SKU" /></label><label>Show<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All products</option><option value="low">Low stock (5 or fewer)</option><option value="hidden">Hidden products</option></select></label><span>{items.length} products</span></div>
    <div className="admin-table admin-products-table"><div className="admin-table-row admin-table-labels"><span>Product</span><span>Inventory</span><span>Price</span></div>{items.map(product => <div className="admin-table-row" key={product.id}><span><strong><Link href={"/admin/products/" + product.id + "/edit"}>{product.title}</Link></strong><small>{product.sku || "No SKU"} · {product.is_active ? "Published" : "Hidden"}</small></span><AdminProductControls productId={product.id} stock={product.stock} active={product.is_active} /><strong>{formatPrice(product.price)}</strong></div>)}</div>
    {!items.length && <p className="admin-empty">No products match this view.</p>}
  </section>;
}
