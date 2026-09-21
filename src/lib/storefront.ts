import {
  categories as fallbackCategories,
  type Product,
} from "@/lib/catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type StorefrontCategory = {
  slug: string;
  name: string;
  description: string | null;
};

export async function getStorefrontProducts(): Promise<Product[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("makranmart_products")
    .select(
      "id, slug, title, description, price, compare_at_price, sku, badge, visual, stock, image_url, is_featured, makranmart_categories!makranmart_products_category_id_fkey(slug, name)"
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error("The store is temporarily unavailable. Please try again shortly.");

  return data.map((row) => {
    const category = Array.isArray(row.makranmart_categories)
      ? row.makranmart_categories[0]
      : row.makranmart_categories;
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
      category: category?.name || "Collection",
      categorySlug: category?.slug || "all",
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

