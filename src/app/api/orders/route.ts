import { NextResponse } from "next/server";
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

  const uniqueSlugs = [...new Set(requestedItems.map((item) => item.slug).filter(Boolean))] as string[];
  const { data: dbProducts, error: productsError } = await admin
    .from("products")
    .select("id, slug, title, price, stock, is_active")
    .in("slug", uniqueSlugs)
    .eq("is_active", true);

  if (productsError || !dbProducts) {
    return NextResponse.json(
      { error: "We could not verify your cart. Please try again." },
      { status: 500 }
    );
  }

  const normalized = requestedItems
    .map((item) => {
      const product = dbProducts.find((entry) => entry.slug === item.slug);
      const quantity = Math.max(1, Math.min(20, Math.floor(Number(item.quantity) || 0)));
      if (!product || !quantity || Number(product.stock) < quantity) return null;
      return { product, quantity };
    })
    .filter(Boolean) as Array<{
      product: { id: string; slug: string; title: string; price: number; stock: number };
      quantity: number;
    }>;

  if (normalized.length !== requestedItems.length) {
    return NextResponse.json(
      { error: "One or more products are unavailable or do not have enough stock." },
      { status: 400 }
    );
  }

  const subtotal = normalized.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const userClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = userClient ? await userClient.auth.getUser() : { data: { user: null } };

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      customer_id: user?.id ?? null,
      customer_name: customerName,
      phone: normalizedPhone,
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
      product_id: product.id,
      product_slug: product.slug,
      title: product.title,
      unit_price: Number(product.price),
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

  for (const { product, quantity } of normalized) {
    await admin
      .from("products")
      .update({
        stock: Math.max(0, Number(product.stock) - quantity),
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);
  }

  return NextResponse.json({
    ok: true,
    orderNumber: order.order_number,
    total,
  });
}
