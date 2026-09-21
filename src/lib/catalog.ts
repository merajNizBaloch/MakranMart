export type Product = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  price: number;
  badge: string;
  visual: string;
  description: string;
  imageUrl?: string | null;
  stock?: number;
  compareAtPrice?: number | null;
  sku?: string | null;
  featured?: boolean;
};

export const categories = [
  { label: "Balochi Crafts", slug: "balochi-crafts", icon: "✦", tone: "orange", className: "chip-1" },
  { label: "Fashion", slug: "fashion", icon: "◌", tone: "ink", className: "chip-2" },
  { label: "Mobiles", slug: "mobiles", icon: "▣", tone: "mint", className: "chip-3" },
  { label: "Electronics", slug: "electronics", icon: "⌁", tone: "purple", className: "chip-4" },
  { label: "Home & Living", slug: "home-living", icon: "⌂", tone: "paper", className: "chip-5" },
  { label: "Beauty", slug: "beauty", icon: "✧", tone: "ink", className: "chip-6" },
  { label: "Groceries", slug: "groceries", icon: "▦", tone: "green", className: "chip-7" },
  { label: "Books", slug: "books", icon: "◫", tone: "blue", className: "chip-8" },
  { label: "Sports", slug: "sports", icon: "◉", tone: "violet", className: "chip-9" },
  { label: "Automotive", slug: "automotive", icon: "◈", tone: "lime", className: "chip-10" },
];

export function formatPrice(price: number) {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}
