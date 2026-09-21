import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { categories as categoryStyles } from "@/lib/catalog";
import { getStorefrontProducts, getStorefrontCategories } from "@/lib/storefront";

export default async function Home() {
  const [products, collections] = await Promise.all([getStorefrontProducts(), getStorefrontCategories()]);
  const categories = collections.map((item, index) => ({ ...categoryStyles[index % categoryStyles.length], slug: item.slug, label: item.name }));
  const featuredProducts = products.slice(0, 4);

  return (
    <main>
      <section className="hero-shell">
        <div className="grid-bg" aria-hidden="true" />
        <Header />

        <div className="hero-content">
          <p className="eyebrow">Your MakranMart store</p>
          <h1>
            Everything you need,
            <br />
            <span className="headline-pill">
              <span className="spark spark-one">✦</span>
              all in one store
              <span className="spark spark-two">✧</span>
              <span className="spark spark-three">✦</span>
            </span>
          </h1>

          <p className="hero-copy">
            Shop everyday essentials, fashion and local finds, selected and
            delivered by MakranMart.
          </p>

          <div className="hero-buttons">
            <Link className="primary-cta" href="/products">
              Start shopping <span>↗</span>
            </Link>
            <Link className="secondary-cta" href="/#featured">
              Explore our collection
            </Link>
          </div>
        </div>

        <div id="categories" className="category-stream" aria-label="Shopping categories">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={`/category/${category.slug}`}
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
            <h2>Picked for your everyday</h2>
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
          <p className="section-kicker">One store. Personal service.</p>
          <h2>From our store to your doorstep.</h2>
          <p>
            Find your next favourite in our collection. Shop directly with
            MakranMart, pay on delivery and follow your orders from your account.
          </p>
          <Link href="/products" className="primary-cta dark-on-light">
            Shop our collection <span>↗</span>
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
      <footer className="store-footer"><span>MakranMart · A TechCraft startup</span><Link href="/account">Track your orders</Link><a href="https://wa.me/923336077281">Contact us on WhatsApp</a><Link href="/admin">Store admin</Link></footer>
    </main>
  );
}
