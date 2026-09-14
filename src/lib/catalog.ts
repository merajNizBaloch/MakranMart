export type Product = {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  price: number;
  badge: string;
  visual: string;
  description: string;
  seller: string;
  location: string;
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
  { label: "Local Sellers", slug: "local-sellers", icon: "▤", tone: "ink", className: "chip-11" },
];

export const products: Product[] = [
  {
    slug: "handcrafted-balochi-tote",
    title: "Handcrafted Balochi Tote",
    category: "Balochi Crafts",
    categorySlug: "balochi-crafts",
    price: 2490,
    badge: "Made in Balochistan",
    visual: "visual-craft",
    description: "A statement tote inspired by traditional Balochi craft, designed for everyday use.",
    seller: "Makran Craft House",
    location: "Turbat, Balochistan",
  },
  {
    slug: "wireless-earbuds-pro",
    title: "Wireless Earbuds Pro",
    category: "Electronics",
    categorySlug: "electronics",
    price: 4250,
    badge: "Popular",
    visual: "visual-tech",
    description: "Compact wireless earbuds with clear calls, touch controls and all-day battery life.",
    seller: "Digital Hub",
    location: "Quetta, Balochistan",
  },
  {
    slug: "everyday-linen-kurta",
    title: "Everyday Linen Kurta",
    category: "Fashion",
    categorySlug: "fashion",
    price: 3190,
    badge: "New",
    visual: "visual-fashion",
    description: "A breathable linen kurta with a clean silhouette for daily wear and warm weather.",
    seller: "Sahil Wear",
    location: "Gwadar, Balochistan",
  },
  {
    slug: "minimal-table-lamp",
    title: "Minimal Table Lamp",
    category: "Home & Living",
    categorySlug: "home-living",
    price: 2850,
    badge: "Home pick",
    visual: "visual-home",
    description: "Warm ambient lighting in a compact modern form for desks, bedsides and reading corners.",
    seller: "Ghar Studio",
    location: "Karachi, Sindh",
  },
  {
    slug: "embroidered-wallet",
    title: "Embroidered Wallet",
    category: "Balochi Crafts",
    categorySlug: "balochi-crafts",
    price: 1290,
    badge: "Local favorite",
    visual: "visual-craft-alt",
    description: "A compact wallet finished with colorful geometric embroidery and practical inner pockets.",
    seller: "Panjgur Handmade",
    location: "Panjgur, Balochistan",
  },
  {
    slug: "power-bank-20000",
    title: "20,000mAh Power Bank",
    category: "Mobiles",
    categorySlug: "mobiles",
    price: 5490,
    badge: "Fast charge",
    visual: "visual-mobile",
    description: "High-capacity portable charging with dual outputs for travel, work and daily use.",
    seller: "Makran Mobile Center",
    location: "Turbat, Balochistan",
  },
  {
    slug: "classic-running-shoes",
    title: "Classic Running Shoes",
    category: "Sports",
    categorySlug: "sports",
    price: 3890,
    badge: "Everyday sport",
    visual: "visual-sport",
    description: "Lightweight trainers with cushioned support for walking, running and daily wear.",
    seller: "Active Pakistan",
    location: "Lahore, Punjab",
  },
  {
    slug: "premium-dates-box",
    title: "Premium Dates Box",
    category: "Groceries",
    categorySlug: "groceries",
    price: 1650,
    badge: "Fresh stock",
    visual: "visual-grocery",
    description: "A carefully packed selection of naturally sweet dates for gifting and everyday snacking.",
    seller: "Makran Foods",
    location: "Panjgur, Balochistan",
  },
];

export const featuredProducts = products.slice(0, 4);

export function formatPrice(price: number) {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}
