import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };

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

export async function POST(request: Request) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const title = String(body.title || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const categoryId = String(body.categoryId || "");
  const sellerId = String(body.sellerId || "");

  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "Enter a valid title and URL slug." }, { status: 400 });
  }

  if (!Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Price and stock must be valid whole numbers." }, { status: 400 });
  }

  if (!categoryId || !sellerId) {
    return NextResponse.json({ error: "Choose a category and seller." }, { status: 400 });
  }

  const compareAtPrice =
    body.compareAtPrice === null || body.compareAtPrice === ""
      ? null
      : Number(body.compareAtPrice);

  const { data, error } = await supabase
    .from("makranmart_products")
    .insert({
      title,
      slug,
      description: String(body.description || "").trim() || null,
      price,
      compare_at_price: Number.isFinite(compareAtPrice) ? compareAtPrice : null,
      stock,
      badge: String(body.badge || "").trim() || null,
      sku: String(body.sku || "").trim() || null,
      category_id: categoryId,
      seller_id: sellerId,
      image_url: body.imageUrl || null,
      is_active: Boolean(body.isActive),
      is_featured: Boolean(body.isFeatured),
    })
    .select("id")
    .single();

  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "That slug or SKU is already in use." : "Could not create product." },
      { status: duplicate ? 409 : 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
