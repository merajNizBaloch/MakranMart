import { NextResponse } from "next/server";
import { products } from "@/lib/catalog";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type OrderRequest = {
  customerName?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  items?: Array<{ slug?: string; quantity?: number }>;
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

  if (!/^03\d{9}$/.test(phone.replace(/[\s-]/g, ""))) {
    return NextResponse.json(
      { error: "Enter a valid Pakistani mobile number." },
      { status: 400 }
    );
  }

  if (requestedItems.length === 0 || requestedItems.length > 50) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const normalized = requestedItems
    .map((item) => {
      const product = products.find((entry) => entry.slug === item.slug);
      const quantity = Math.max(1, Math.min(20, Math.floor(Number(item.quantity) || 0)));
      if (!product || !quantity) return null;
      return { product, quantity };
    })
    .filter(Boolean) as Array<{ product: (typeof products)[number]; quantity: number }>;

  if (normalized.length !== requestedItems.length) {
    return NextResponse.json(
      { error: "One or more products are no longer available." },
      { status: 400 }
    );
  }

  const subtotal = normalized.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "MakranMart database is not connected yet. Add the Supabase environment variables to activate orders.",
      },
      { status: 503 }
    );
  }

  const userClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = userClient ? await userClient.auth.getUser() : { data: { user: null } };

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      customer_id: user?.id ?? null,
      customer_name: customerName,
      phone: phone.replace(/[\s-]/g, ""),
      address,
      city,
      province,
      payment_method: "cod",
      status: "pending",
      subtotal,
      delivery_fee: deliveryFee,
      total,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "We could not create your order. Please try again." },
      { status: 500 }
    );
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    normalized.map(({ product, quantity }) => ({
      order_id: order.id,
      product_slug: product.slug,
      title: product.title,
      unit_price: product.price,
      quantity,
    }))
  );

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: "We could not save the order items. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    orderNumber: order.order_number,
    total,
  });
}
