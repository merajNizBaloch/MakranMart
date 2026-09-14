import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getAdmin() {
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
  const { supabase, error: authError } = await getAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const name = String(body.name || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();
  const sortOrder = Number(body.sortOrder || 0);

  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isInteger(sortOrder)) {
    return NextResponse.json({ error: "Enter a valid category name, slug and sort order." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("makranmart_categories")
    .insert({
      name,
      slug,
      description: String(body.description || "").trim() || null,
      sort_order: sortOrder,
      is_active: Boolean(body.isActive),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "That category slug is already in use." : "Could not add category." },
      { status: duplicate ? 409 : 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
