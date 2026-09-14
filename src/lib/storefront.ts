import { products as fallbackProducts, type Product } from "@/lib/catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getStorefrontProducts(): Promise<Product[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("makranmart_products")
    .select(
      "slug, title, description, price, badge, visual, stock, makranmart_categories!makranmart_products_category_id_fkey(slug, name), makranmart_sellers!makranmart_products_seller_id_fkey(name, location)"
    )
    .eq("is_active", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return fallbackProducts;

  return data.map((row) => {
    const category = Array.isArray(row.makranmart_categories)
      ? row.makranmart_categories[0]
      : row.makranmart_categories;
    const seller = Array.isArray(row.makranmart_sellers)
      ? row.makranmart_sellers[0]
      : row.makranmart_sellers;

    return {
      slug: row.slug,
      title: row.title,
      description: row.description || "",
      price: Number(row.price),
      badge: row.badge || "MakranMart",
      visual: row.visual || "visual-tech",
      category: category?.name || "Marketplace",
      categorySlug: category?.slug || "all",
      seller: seller?.name || "MakranMart Seller",
      location: seller?.location || "Pakistan",
    };
  });
}
