import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { categories } from "@/lib/catalog";
import { getStorefrontProducts } from "@/lib/storefront";

export default async function Home() {
  const products = await getStorefrontProducts();
  const featuredProducts = products.slice(0, 4);

  return (
    <main>
      <section className="hero-shell">
        <div className="grid-bg" aria-hidden="true" />
        <Header />

        <div className="hero-content">
          <p className="eyebrow">Balochistan&apos;s modern marketplace</p>
          <h1>
            Everything you need,
            <br />
            <span className="headline-pill">
              <span className="spark spark-one">✦</span>
              all in one market
              <span className="spark spark-two">✧</span>
              <span className="spark spark-three">✦</span>
            </span>
          </h1>

          <p className="hero-copy">
            Discover trusted products, independent sellers and local finds from
            Balochistan to the rest of Pakistan.
          </p>

          <div className="hero-buttons">
            <Link className="primary-cta" href="/products">
              Start shopping <span>↗</span>
            </Link>
            <Link className="secondary-cta" href="/#local">
              Sell on MakranMart
            </Link>
          </div>
        </div>

        <div id="categories" className="category-stream" aria-label="Shopping categories">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={category.slug === "local-sellers" ? "/#local" : `/category/${category.slug}`}
              className={`category-chip ${category.tone} ${category.className}`}
            >
              <span className="chip-icon">{category.icon}</span>
              {category.label}
            </Link>
          ))}
        </div>

        <div className="hero-foot">
          <span>Scroll to explore</span>
          <span className="scroll-line" />
        </div>
      </section>

      <section className="section-wrap" id="featured">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Curated for you</p>
            <h2>Trending across Makran</h2>
          </div>
          <Link href="/products" className="text-link">
            View all products <span>↗</span>
          </Link>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="local-banner" id="local">
        <div className="local-copy">
          <p className="section-kicker">Made closer to home</p>
          <h2>Local products deserve a national shelf.</h2>
          <p>
            MakranMart brings artisans, shops and emerging brands from Balochistan
            into one clean storefront built for buyers across Pakistan.
          </p>
          <Link href="/category/balochi-crafts" className="primary-cta dark-on-light">
            Explore local sellers <span>↗</span>
          </Link>
        </div>

        <div className="seller-stack" aria-hidden="true">
          <div className="seller-card seller-card-one">
            <span>01</span>
            <strong>Craft</strong>
            <small>Handmade pieces</small>
          </div>
          <div className="seller-card seller-card-two">
            <span>02</span>
            <strong>Wear</strong>
            <small>Local fashion</small>
          </div>
          <div className="seller-card seller-card-three">
            <span>03</span>
            <strong>Home</strong>
            <small>Everyday essentials</small>
          </div>
        </div>
      </section>
    </main>
  );
}
