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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

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

  if ("title" in body) {
    const title = String(body.title || "").trim();
    const slug = String(body.slug || "").trim().toLowerCase();
    const price = Number(body.price);
    const categoryId = String(body.categoryId || "");
    const { data: store } = await supabase.from("makranmart_sellers").select("id").eq("slug", "makranmart-store").eq("is_active", true).single();
  if (!store) return NextResponse.json({ error: "Store configuration unavailable." }, { status: 503 });
  const sellerId = store.id;

    if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json({ error: "Enter a valid title and URL slug." }, { status: 400 });
    }

    if (!Number.isInteger(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a valid whole number." }, { status: 400 });
    }

    if (!categoryId || !sellerId) {
      return NextResponse.json({ error: "Choose a category." }, { status: 400 });
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
      seller_id: sellerId,
      image_url: body.imageUrl || null,
      is_featured: Boolean(body.isFeatured),
    });
  }

  const { id } = await params;
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

  return NextResponse.json({ ok: true });
}
