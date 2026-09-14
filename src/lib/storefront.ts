import { products as fallbackProducts, type Product } from "@/lib/catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getStorefrontProducts(): Promise<Product[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return fallbackProducts;

  const { data, error } = await supabase
    .from("products")
    .select(
      "slug, title, description, price, badge, visual, stock, categories!products_category_id_fkey(slug, name), sellers!products_seller_id_fkey(name, location)"
    )
    .eq("is_active", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return fallbackProducts;

  return data.map((row) => {
    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    const seller = Array.isArray(row.sellers) ? row.sellers[0] : row.sellers;

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

export async function getStorefrontProduct(slug: string) {
  const products = await getStorefrontProducts();
  return products.find((product) => product.slug === slug) ?? null;
}
