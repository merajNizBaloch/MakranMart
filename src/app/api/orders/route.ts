import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type OrderRequest = {
  customerName?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  items?: Array<{ slug?: string; quantity?: number; variantId?: string | null }>;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as OrderRequest | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const customerName = body.customerName?.trim();
  const phone = body.phone?.trim();
  const address = body.address?.trim();
  const city = body.city?.trim();
  const province = body.province?.trim();
  const requestedItems = Array.isArray(body.items) ? body.items : [];

  if (!customerName || !phone || !address || !city || !province) {
    return NextResponse.json(
      { error: "Please complete all delivery details." },
      { status: 400 }
    );
  }

  const normalizedPhone = phone.replace(/[\s-]/g, "");
  if (!/^03\d{9}$/.test(normalizedPhone)) {
    return NextResponse.json(
      { error: "Enter a valid Pakistani mobile number." },
      { status: 400 }
    );
  }

  if (requestedItems.length === 0 || requestedItems.length > 50) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const items = requestedItems.map((item) => ({
    slug: item.slug,
    quantity: Math.max(1, Math.min(20, Math.floor(Number(item.quantity) || 0))),
    variantId: item.variantId || null,
  }));

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("makranmart_place_order", {
    p_customer_name: customerName,
    p_phone: normalizedPhone,
    p_address: address,
    p_city: city,
    p_province: province,
    p_items: items,
  });

  if (error || !data?.length) {
    const message = error?.message || "We could not create your order.";
    const unavailable =
      message.toLowerCase().includes("stock") ||
      message.toLowerCase().includes("unavailable") ||
      message.toLowerCase().includes("option");

    return NextResponse.json(
      {
        error: unavailable
          ? message.toLowerCase().includes("choose")
            ? "Please choose an available option for each product."
            : "One or more products or options are unavailable or do not have enough stock."
          : "We could not create your order. Please try again.",
      },
      { status: unavailable ? 400 : 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    orderNumber: data[0].order_number,
    total: Number(data[0].total),
    deliveryFee: Number(data[0].delivery_fee || 0),
  });
}
