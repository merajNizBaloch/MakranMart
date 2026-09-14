import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import {
  getStorefrontCategories,
  getStorefrontProducts,
} from "@/lib/storefront";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [products, categories] = await Promise.all([
    getStorefrontProducts(),
    getStorefrontCategories(),
  ]);

  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const categoryProducts = products.filter(
    (product) => product.categorySlug === slug
  );

  return (
    <main>
      <div className="catalog-top category-top">
        <Header />
        <div className="catalog-hero">
          <p className="eyebrow">Category / {category.name}</p>
          <h1>{category.name}</h1>
          <p>
            {category.description ||
              "Explore selected products from trusted MakranMart sellers."}
          </p>
        </div>
      </div>

      <section className="section-wrap category-page-section">
        <div className="results-head">
          <span>{categoryProducts.length} products</span>
          <Link href="/products">← All products</Link>
        </div>

        {categoryProducts.length > 0 ? (
          <div className="product-grid catalog-grid">
            {categoryProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="category-empty">
            <span>✦</span>
            <h2>Products are coming soon.</h2>
            <p>We are onboarding sellers for this category now.</p>
            <Link href="/products" className="primary-cta">
              Browse available products <span>↗</span>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
