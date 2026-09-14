import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const province = String(body?.province || "").trim();
  const subtotal = Math.max(0, Number(body?.subtotal) || 0);

  if (!province) {
    return NextResponse.json({ error: "Choose a province." }, { status: 400 });
  }

  const regionKey =
    province.toLowerCase() === "balochistan"
      ? "balochistan"
      : "rest-pakistan";

  const supabase = await createServerSupabaseClient();

  const { data: rule, error } = await supabase
    .from("makranmart_shipping_rules")
    .select("name, fee, free_threshold, eta_min_days, eta_max_days")
    .eq("region_key", regionKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !rule) {
    return NextResponse.json({
      fee: 0,
      etaMinDays: null,
      etaMaxDays: null,
      freeThreshold: null,
    });
  }

  const fee =
    rule.free_threshold != null && subtotal >= Number(rule.free_threshold)
      ? 0
      : Number(rule.fee);

  return NextResponse.json({
    fee,
    etaMinDays: Number(rule.eta_min_days),
    etaMaxDays: Number(rule.eta_max_days),
    freeThreshold:
      rule.free_threshold == null ? null : Number(rule.free_threshold),
  });
}
