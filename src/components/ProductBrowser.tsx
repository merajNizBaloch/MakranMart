"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/catalog";

type SortMode = "featured" | "price-low" | "price-high" | "name";

export function ProductBrowser({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState<SortMode>("featured");
  const [searchFocused, setSearchFocused] = useState(false);

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Map(products.map((product) => [product.categorySlug, product.category])).entries()
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [products]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        !normalized ||
        [
          product.title,
          product.category,
          product.seller,
          product.location,
          product.description,
          product.sku || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      const matchesCategory =
        category === "all" || product.categorySlug === category;

      const matchesPrice =
        price === "all" ||
        (price === "under-2000" && product.price < 2000) ||
        (price === "2000-4000" && product.price >= 2000 && product.price <= 4000) ||
        (price === "over-4000" && product.price > 4000);

      return matchesSearch && matchesCategory && matchesPrice;
    });

    return [...result].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "name") return a.title.localeCompare(b.title);
      if (a.featured !== b.featured) return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      return a.title.localeCompare(b.title);
    });
  }, [products, query, category, price, sort]);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];

    return products
      .filter((product) =>
        [product.title, product.seller, product.category, product.location]
          .join(" ")
          .toLowerCase()
          .includes(normalized)
      )
      .slice(0, 6);
  }, [products, query]);

  const hasFilters =
    query || category !== "all" || price !== "all" || sort !== "featured";

  function reset() {
    setQuery("");
    setCategory("all");
    setPrice("all");
    setSort("featured");
  }

  return (
    <div className="product-browser">
      <div className="catalog-filter-bar">
        <div className="catalog-search-wrap">
          <label className="catalog-search">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
              placeholder="Search products, sellers, cities…"
              aria-label="Search products"
              autoComplete="off"
            />
          </label>

          {searchFocused && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((product) => (
                <Link href={`/product/${product.slug}`} key={product.slug}>
                  <span
                    className={`suggestion-thumb ${product.visual}`}
                    style={product.imageUrl ? { backgroundImage: `url("${product.imageUrl}")` } : undefined}
                  >
                    {!product.imageUrl && "MM"}
                  </span>
                  <span className="suggestion-copy">
                    <strong>{product.title}</strong>
                    <small>{product.seller} · {product.category}</small>
                  </span>
                  <b>↗</b>
                </Link>
              ))}
            </div>
          )}
        </div>

        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categoryOptions.map(([slug, name]) => (
            <option value={slug} key={slug}>{name}</option>
          ))}
        </select>

        <select value={price} onChange={(event) => setPrice(event.target.value)} aria-label="Filter by price">
          <option value="all">Any price</option>
          <option value="under-2000">Under Rs. 2,000</option>
          <option value="2000-4000">Rs. 2,000 – 4,000</option>
          <option value="over-4000">Above Rs. 4,000</option>
        </select>

        <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="Sort products">
          <option value="featured">Featured first</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
          <option value="name">Name: A–Z</option>
        </select>
      </div>

      <div className="results-head product-browser-head">
        <span>{filtered.length} of {products.length} products</span>
        {hasFilters ? (
          <button className="clear-filter" onClick={reset}>
            Clear filters
          </button>
        ) : (
          <span>Live MakranMart catalog</span>
        )}
      </div>

      {filtered.length ? (
        <div className="product-grid catalog-grid">
          {filtered.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="catalog-no-results">
          <span>⌕</span>
          <h2>No products found.</h2>
          <p>Try another product name, seller, category or price range.</p>
          <button className="primary-cta" onClick={reset}>
            Reset search
          </button>
        </div>
      )}
    </div>
  );
}
