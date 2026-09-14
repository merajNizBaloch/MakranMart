import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { categories } from "@/lib/catalog";
import { getStorefrontProducts } from "@/lib/storefront";
import Link from "next/link";

export default async function ProductsPage() {
  const products = await getStorefrontProducts();

  return (
    <main>
      <div className="catalog-top">
        <Header />
        <div className="catalog-hero">
          <p className="eyebrow">MakranMart catalog</p>
          <h1>Find what you need.</h1>
          <p>
            Search products, sellers and locations, then filter by category,
            price or sort order.
          </p>
        </div>
      </div>

      <section className="catalog-layout">
        <aside className="category-sidebar">
          <p className="mini-label">Browse categories</p>
          <Link href="/products" className="sidebar-link active">
            All products <span>{products.length}</span>
          </Link>
          {categories
            .filter((category) => category.slug !== "local-sellers")
            .map((category) => {
              const count = products.filter(
                (product) => product.categorySlug === category.slug
              ).length;

              return (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="sidebar-link"
                >
                  {category.label} <span>{count || "—"}</span>
                </Link>
              );
            })}
        </aside>

        <div className="catalog-results">
          <ProductBrowser products={products} />
        </div>
      </section>
    </main>
  );
}
