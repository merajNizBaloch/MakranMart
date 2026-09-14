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

  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "Enter a valid seller name and URL slug." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("makranmart_sellers")
    .insert({
      name,
      slug,
      location: String(body.location || "").trim() || null,
      contact_name: String(body.contactName || "").trim() || null,
      phone: String(body.phone || "").trim() || null,
      whatsapp: String(body.whatsapp || "").trim() || null,
      email: String(body.email || "").trim().toLowerCase() || null,
      notes: String(body.notes || "").trim() || null,
      is_verified: Boolean(body.isVerified),
      is_active: Boolean(body.isActive),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "That seller slug is already in use." : "Could not add seller." },
      { status: duplicate ? 409 : 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
