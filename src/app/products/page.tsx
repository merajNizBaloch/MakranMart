import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { categories, products } from "@/lib/catalog";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <main>
      <div className="catalog-top">
        <Header />
        <div className="catalog-hero">
          <p className="eyebrow">MakranMart catalog</p>
          <h1>Shop everything.</h1>
          <p>Local craft, everyday essentials and modern products from trusted sellers across Pakistan.</p>
        </div>
      </div>

      <section className="catalog-layout">
        <aside className="category-sidebar">
          <p className="mini-label">Browse categories</p>
          <Link href="/products" className="sidebar-link active">All products <span>{products.length}</span></Link>
          {categories.filter((category) => category.slug !== "local-sellers").map((category) => {
            const count = products.filter((product) => product.categorySlug === category.slug).length;
            return (
              <Link key={category.slug} href={`/category/${category.slug}`} className="sidebar-link">
                {category.label} <span>{count || "—"}</span>
              </Link>
            );
          })}
        </aside>

        <div className="catalog-results">
          <div className="results-head">
            <span>{products.length} products</span>
            <span>Curated marketplace</span>
          </div>
          <div className="product-grid catalog-grid">
            {products.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
