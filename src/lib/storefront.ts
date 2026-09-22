import {
  categories as fallbackCategories,
  type Product,
  type ProductVariant,
} from "@/lib/catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type StorefrontCategory = {
  slug: string;
  name: string;
  description: string | null;
};

type RawVariant = ProductVariant & { is_active?: boolean; sort_order?: number };
type RawCategory = { slug?: string; name?: string };
type StorefrontRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  sku: string | null;
  badge: string | null;
  visual: string | null;
  stock: number | string;
  image_url: string | null;
  gallery_urls?: string[] | null;
  specifications?: Record<string, unknown> | null;
  is_featured: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  created_at: string;
  makranmart_categories?: RawCategory | RawCategory[] | null;
  makranmart_product_variants?: RawVariant[] | null;
};

export async function getStorefrontProducts(): Promise<Product[]> {
  const supabase = await createServerSupabaseClient();

  const v2 = await supabase
    .from("makranmart_products")
    .select(
      "id, slug, title, description, price, compare_at_price, sku, badge, visual, stock, image_url, gallery_urls, specifications, is_featured, is_new, is_bestseller, created_at, makranmart_categories!makranmart_products_category_id_fkey(slug, name), makranmart_product_variants(id, name, sku, price, stock, is_active, sort_order)"
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  let rows: StorefrontRow[];

  if (v2.error) {
    // Safe rollout fallback: keep the storefront available until Product System V2
    // has been applied to the connected Supabase project.
    const legacy = await supabase
      .from("makranmart_products")
      .select(
        "id, slug, title, description, price, compare_at_price, sku, badge, visual, stock, image_url, is_featured, created_at, makranmart_categories!makranmart_products_category_id_fkey(slug, name)"
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (legacy.error) {
      throw new Error("The store is temporarily unavailable. Please try again shortly.");
    }

    rows = (legacy.data || []) as unknown as StorefrontRow[];
  } else {
    rows = (v2.data || []) as unknown as StorefrontRow[];
  }

  return rows.map((row) => {
    const category = Array.isArray(row.makranmart_categories)
      ? row.makranmart_categories[0]
      : row.makranmart_categories;

    const variants = (row.makranmart_product_variants || [])
      .filter((variant) => variant.is_active !== false)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price == null ? null : Number(variant.price),
        stock: Number(variant.stock || 0),
      }));

    const imageUrls = Array.from(
      new Set(
        [row.image_url, ...((row.gallery_urls || []) as string[])]
          .filter((url): url is string => Boolean(url))
      )
    );

    const stock = variants.length
      ? variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
      : Number(row.stock);

    const specifications =
      row.specifications && typeof row.specifications === "object" && !Array.isArray(row.specifications)
        ? Object.fromEntries(
            Object.entries(row.specifications as Record<string, unknown>).map(([key, value]) => [key, String(value)])
          )
        : {};

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
      imageUrl: imageUrls[0] || null,
      imageUrls,
      stock,
      featured: Boolean(row.is_featured),
      isNew: Boolean(row.is_new),
      isBestseller: Boolean(row.is_bestseller),
      specifications,
      variants,
      createdAt: row.created_at,
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
    return fallbackCategories.map((category) => ({
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
