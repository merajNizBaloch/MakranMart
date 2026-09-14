import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const allowedStatuses = new Set([
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
  const status = body?.status;
  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  }

  const { id } = await params;
  const { error } = await supabase
    .from("makranmart_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Could not update order." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
