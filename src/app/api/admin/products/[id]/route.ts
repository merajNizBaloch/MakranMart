import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { supabase, error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { supabase, error: null };
}

function normalizeVariants(input: unknown) {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => {
      const value = item as Record<string, unknown>;
      return {
        id: typeof value.id === "string" ? value.id : undefined,
        name: String(value.name || "").trim(),
        sku: String(value.sku || "").trim() || null,
        price: value.price === null || value.price === "" || value.price === undefined ? null : Number(value.price),
        stock: Number(value.stock),
        sort_order: Number.isInteger(Number(value.sortOrder)) ? Number(value.sortOrder) : index,
      };
    })
    .filter((variant) => variant.name);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { id } = await params;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("stock" in body) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
      return NextResponse.json({ error: "Invalid stock value." }, { status: 400 });
    }
    update.stock = stock;
  }

  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "Invalid visibility value." }, { status: 400 });
    }
    update.is_active = body.isActive;
  }

  let variants: ReturnType<typeof normalizeVariants> | null = null;

  if ("title" in body) {
    const title = String(body.title || "").trim();
    const slug = String(body.slug || "").trim().toLowerCase();
    const price = Number(body.price);
    const categoryId = String(body.categoryId || "");
    variants = normalizeVariants(body.variants);
    const galleryUrls = Array.isArray(body.galleryUrls)
      ? Array.from(new Set(body.galleryUrls.map((url: unknown) => String(url || "").trim()).filter(Boolean)))
      : [];
    const specifications =
      body.specifications && typeof body.specifications === "object" && !Array.isArray(body.specifications)
        ? body.specifications
        : {};

    const { data: store } = await supabase
      .from("makranmart_sellers")
      .select("id")
      .eq("slug", "makranmart-store")
      .eq("is_active", true)
      .single();

    if (!store) return NextResponse.json({ error: "Store configuration unavailable." }, { status: 503 });

    if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json({ error: "Enter a valid title and URL slug." }, { status: 400 });
    }

    if (!Number.isInteger(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a valid whole number." }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Choose a category." }, { status: 400 });
    }

    if (variants.some((variant) =>
      !Number.isInteger(variant.stock) ||
      variant.stock < 0 ||
      (variant.price !== null && (!Number.isInteger(variant.price) || variant.price < 0))
    )) {
      return NextResponse.json({ error: "Variant price and stock must be valid whole numbers." }, { status: 400 });
    }

    if (new Set(variants.map((variant) => variant.name.toLowerCase())).size !== variants.length) {
      return NextResponse.json({ error: "Variant names must be unique." }, { status: 400 });
    }

    const compareAtPrice =
      body.compareAtPrice === null || body.compareAtPrice === ""
        ? null
        : Number(body.compareAtPrice);

    Object.assign(update, {
      title,
      slug,
      description: String(body.description || "").trim() || null,
      price,
      compare_at_price: Number.isFinite(compareAtPrice) ? compareAtPrice : null,
      badge: String(body.badge || "").trim() || null,
      sku: String(body.sku || "").trim() || null,
      category_id: categoryId,
      seller_id: store.id,
      image_url: galleryUrls[0] || body.imageUrl || null,
      gallery_urls: galleryUrls,
      specifications,
      is_featured: Boolean(body.isFeatured),
      is_new: Boolean(body.isNew),
      is_bestseller: Boolean(body.isBestseller),
    });
  }

  const { error } = await supabase
    .from("makranmart_products")
    .update(update)
    .eq("id", id);

  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "That slug or SKU is already in use." : "Could not update product." },
      { status: duplicate ? 409 : 500 }
    );
  }

  if (variants) {
    const { data: existing, error: existingError } = await supabase
      .from("makranmart_product_variants")
      .select("id, name")
      .eq("product_id", id);

    if (existingError) {
      return NextResponse.json({ error: "Product saved, but variants could not be loaded." }, { status: 500 });
    }

    const existingRows = existing || [];
    const keptIds: string[] = [];

    for (const variant of variants) {
      const matched = existingRows.find(
        (row) => row.id === variant.id || row.name.toLowerCase() === variant.name.toLowerCase()
      );

      if (matched) {
        const { error: variantError } = await supabase
          .from("makranmart_product_variants")
          .update({
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            sort_order: variant.sort_order,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", matched.id)
          .eq("product_id", id);

        if (variantError) {
          return NextResponse.json(
            { error: variantError.code === "23505" ? "Variant names or SKUs must be unique." : "Could not update product variants." },
            { status: variantError.code === "23505" ? 409 : 500 }
          );
        }
        keptIds.push(matched.id);
      } else {
        const { data: created, error: variantError } = await supabase
          .from("makranmart_product_variants")
          .insert({
            product_id: id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            sort_order: variant.sort_order,
            is_active: true,
          })
          .select("id")
          .single();

        if (variantError || !created) {
          return NextResponse.json(
            { error: variantError?.code === "23505" ? "Variant names or SKUs must be unique." : "Could not create product variant." },
            { status: variantError?.code === "23505" ? 409 : 500 }
          );
        }
        keptIds.push(created.id);
      }
    }

    const removedIds = existingRows.map((row) => row.id).filter((variantId) => !keptIds.includes(variantId));
    if (removedIds.length) {
      await supabase
        .from("makranmart_product_variants")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("id", removedIds)
        .eq("product_id", id);
    }
  }

  return NextResponse.json({ ok: true });
}
