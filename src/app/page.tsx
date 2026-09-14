const categories = [
  { label: "Balochi Crafts", icon: "✦", tone: "orange", className: "chip-1" },
  { label: "Fashion", icon: "◌", tone: "ink", className: "chip-2" },
  { label: "Mobiles", icon: "▣", tone: "mint", className: "chip-3" },
  { label: "Electronics", icon: "⌁", tone: "purple", className: "chip-4" },
  { label: "Home & Living", icon: "⌂", tone: "paper", className: "chip-5" },
  { label: "Beauty", icon: "✧", tone: "ink", className: "chip-6" },
  { label: "Groceries", icon: "▦", tone: "green", className: "chip-7" },
  { label: "Books", icon: "◫", tone: "blue", className: "chip-8" },
  { label: "Sports", icon: "◉", tone: "violet", className: "chip-9" },
  { label: "Automotive", icon: "◈", tone: "lime", className: "chip-10" },
  { label: "Local Sellers", icon: "▤", tone: "ink", className: "chip-11" },
];

const featured = [
  {
    title: "Handcrafted Balochi Tote",
    category: "Local Crafts",
    price: "Rs. 2,490",
    badge: "Made in Balochistan",
    visual: "visual-craft",
  },
  {
    title: "Wireless Earbuds Pro",
    category: "Electronics",
    price: "Rs. 4,250",
    badge: "Popular",
    visual: "visual-tech",
  },
  {
    title: "Everyday Linen Kurta",
    category: "Fashion",
    price: "Rs. 3,190",
    badge: "New",
    visual: "visual-fashion",
  },
  {
    title: "Minimal Table Lamp",
    category: "Home & Living",
    price: "Rs. 2,850",
    badge: "Home pick",
    visual: "visual-home",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell">
        <div className="grid-bg" aria-hidden="true" />

        <nav className="nav-wrap">
          <a href="#" className="brand" aria-label="MakranMart home">
            <span className="brand-mark">M</span>
            <span>MakranMart</span>
          </a>

          <div className="nav-links">
            <a href="#categories">Categories</a>
            <a href="#featured">Featured</a>
            <a href="#local">Local sellers</a>
          </div>

          <div className="nav-actions">
            <button className="icon-button" aria-label="Search">
              <span>⌕</span>
            </button>
            <button className="cart-button">
              Cart <span className="cart-count">0</span>
            </button>
          </div>
        </nav>

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
            <a className="primary-cta" href="#featured">
              Start shopping <span>↗</span>
            </a>
            <a className="secondary-cta" href="#local">
              Sell on MakranMart
            </a>
          </div>
        </div>

        <div id="categories" className="category-stream" aria-label="Shopping categories">
          {categories.map((category) => (
            <a
              key={category.label}
              href={"#featured"}
              className={`category-chip ${category.tone} ${category.className}`}
            >
              <span className="chip-icon">{category.icon}</span>
              {category.label}
            </a>
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
          <a href="#" className="text-link">
            View all products <span>↗</span>
          </a>
        </div>

        <div className="product-grid">
          {featured.map((item) => (
            <article className="product-card" key={item.title}>
              <div className={`product-visual ${item.visual}`}>
                <span className="product-badge">{item.badge}</span>
                <span className="visual-shape visual-shape-one" />
                <span className="visual-shape visual-shape-two" />
                <span className="visual-center-mark">MM</span>
                <button className="quick-add" aria-label={`Add ${item.title} to cart`}>
                  +
                </button>
              </div>
              <div className="product-info">
                <div>
                  <p>{item.category}</p>
                  <h3>{item.title}</h3>
                </div>
                <strong>{item.price}</strong>
              </div>
            </article>
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
          <a href="#" className="primary-cta dark-on-light">
            Explore local sellers <span>↗</span>
          </a>
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
