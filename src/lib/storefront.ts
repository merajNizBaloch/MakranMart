import {
  categories as fallbackCategories,
  products as fallbackProducts,
  type Product,
} from "@/lib/catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type StorefrontCategory = {
  slug: string;
  name: string;
  description: string | null;
};

export type StorefrontSeller = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  description: string | null;
  verified: boolean;
};

export async function getStorefrontProducts(): Promise<Product[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("makranmart_products")
    .select(
      "id, slug, title, description, price, compare_at_price, sku, badge, visual, stock, image_url, is_featured, makranmart_categories!makranmart_products_category_id_fkey(slug, name), makranmart_sellers!makranmart_products_seller_id_fkey(slug, name, location, is_verified)"
    )
    .eq("is_active", true)
    .gt("stock", 0)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return fallbackProducts;

  return data.map((row) => {
    const category = Array.isArray(row.makranmart_categories)
      ? row.makranmart_categories[0]
      : row.makranmart_categories;
    const seller = Array.isArray(row.makranmart_sellers)
      ? row.makranmart_sellers[0]
      : row.makranmart_sellers;

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description || "",
      price: Number(row.price),
      compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
      sku: row.sku,
      badge: row.badge || "MakranMart",
      visual: row.visual || "visual-tech",
      category: category?.name || "Marketplace",
      categorySlug: category?.slug || "all",
      seller: seller?.name || "MakranMart Seller",
      sellerSlug: seller?.slug,
      sellerVerified: Boolean(seller?.is_verified),
      location: seller?.location || "Pakistan",
      imageUrl: row.image_url,
      stock: Number(row.stock),
      featured: Boolean(row.is_featured),
    };
  });
}

export async function getStorefrontCategories(): Promise<StorefrontCategory[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("makranmart_categories")
    .select("slug, name, description")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) {
    return fallbackCategories
      .filter((category) => category.slug !== "local-sellers")
      .map((category) => ({
        slug: category.slug,
        name: category.label,
        description: null,
      }));
  }

  return data.map((category) => ({
    slug: category.slug,
    name: category.name,
    description: category.description,
  }));
}

export async function getStorefrontSeller(
  slug: string
): Promise<StorefrontSeller | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("makranmart_sellers")
    .select("id, slug, name, location, description, is_verified")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    location: data.location,
    description: data.description,
    verified: Boolean(data.is_verified),
  };
}
