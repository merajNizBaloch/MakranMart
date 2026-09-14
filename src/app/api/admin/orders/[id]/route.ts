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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const status = String(body?.status || "");
  const note = String(body?.note || "").trim();
  const customerVisible = body?.customerVisible !== false;

  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  }

  if (note.length > 500) {
    return NextResponse.json({ error: "Order notes can be up to 500 characters." }, { status: 400 });
  }

  const { id } = await params;

  const { data, error } = await supabase.rpc("makranmart_update_order_status", {
    p_order_id: id,
    p_status: status,
    p_note: note || null,
    p_customer_visible: customerVisible,
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("not enough stock")) {
      return NextResponse.json(
        { error: "This cancelled order cannot be reactivated because stock is no longer available." },
        { status: 409 }
      );
    }

    if (
      message.includes("transition") ||
      message.includes("unshipped") ||
      message.includes("cancelled")
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (message.includes("not found")) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Could not update the order." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: data?.[0]?.status || status,
    updatedAt: data?.[0]?.updated_at || new Date().toISOString(),
  });
}
