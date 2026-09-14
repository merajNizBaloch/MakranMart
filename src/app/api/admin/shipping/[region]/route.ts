import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ region: string }> }
) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const fee = Number(body.fee);
  const freeThreshold =
    body.freeThreshold === null || body.freeThreshold === ""
      ? null
      : Number(body.freeThreshold);
  const etaMinDays = Number(body.etaMinDays);
  const etaMaxDays = Number(body.etaMaxDays);

  if (
    !Number.isInteger(fee) ||
    fee < 0 ||
    (freeThreshold !== null &&
      (!Number.isInteger(freeThreshold) || freeThreshold < 0)) ||
    !Number.isInteger(etaMinDays) ||
    etaMinDays < 0 ||
    !Number.isInteger(etaMaxDays) ||
    etaMaxDays < etaMinDays
  ) {
    return NextResponse.json({ error: "Enter valid delivery values." }, { status: 400 });
  }

  const { region } = await params;

  const { error } = await supabase
    .from("makranmart_shipping_rules")
    .update({
      fee,
      free_threshold: freeThreshold,
      eta_min_days: etaMinDays,
      eta_max_days: etaMaxDays,
      is_active: Boolean(body.isActive),
      updated_at: new Date().toISOString(),
    })
    .eq("region_key", region);

  if (error) {
    return NextResponse.json({ error: "Could not update shipping rule." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
