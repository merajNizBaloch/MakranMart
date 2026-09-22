import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminOrderStatus } from "@/components/AdminOrderStatus";
import { OrderTimeline } from "@/components/OrderTimeline";
import { PrintOrderButton } from "@/components/PrintOrderButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/catalog";

function whatsappUrl(phone: string, customerName: string, orderNumber: string) {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("0")
    ? "92" + digits.slice(1)
    : digits.startsWith("92")
      ? digits
      : "92" + digits;

  const message = encodeURIComponent(
    `Assalam-o-Alaikum ${customerName}, this is MakranMart regarding your order ${orderNumber}.`
  );

  return `https://wa.me/${international}?text=${message}`;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/admin/login?next=/admin/orders/${id}`);

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  const [{ data: order }, { data: events }] = await Promise.all([
    supabase
      .from("makranmart_orders")
      .select("id, order_number, customer_id, customer_name, phone, address, city, province, payment_method, status, subtotal, delivery_fee, total, stock_released_at, created_at, updated_at, makranmart_order_items(id, product_id, product_slug, title, unit_price, quantity, line_total, variant_name, variant_sku)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("makranmart_order_events")
      .select("id, from_status, to_status, note, customer_visible, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!order) notFound();

  const items = order.makranmart_order_items || [];
  const whatsapp = whatsappUrl(order.phone, order.customer_name, order.order_number);

  return (
    <main className="admin-editor-shell order-detail-shell">
      <header className="order-detail-head no-print">
        <div>
          <p className="eyebrow">Order management</p>
          <h1>{order.order_number}</h1>
          <p>Placed {new Date(order.created_at).toLocaleString("en-PK", { dateStyle: "long", timeStyle: "short" })}</p>
        </div>

        <div className="order-detail-actions">
          <Link href="/admin/orders" className="secondary-cta">← All orders</Link>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="secondary-cta">
            WhatsApp customer ↗
          </a>
          <PrintOrderButton />
        </div>
      </header>

      <section className="order-detail-grid">
        <div className="order-detail-main">
          <section className="order-invoice">
            <div className="invoice-head">
              <div>
                <Link href="/" className="brand invoice-brand">
                  <span className="brand-mark">M</span>
                  <span>MakranMart</span>
                </Link>
                <p>Order invoice</p>
              </div>

              <div className="invoice-number">
                <small>Order</small>
                <strong>{order.order_number}</strong>
                <span>{new Date(order.created_at).toLocaleDateString("en-PK", { dateStyle: "long" })}</span>
              </div>
            </div>

            <div className="invoice-parties">
              <div>
                <small>Deliver to</small>
                <strong>{order.customer_name}</strong>
                <p>{order.address}<br />{order.city}, {order.province}</p>
                <span>{order.phone}</span>
              </div>

              <div>
                <small>Payment</small>
                <strong>Cash on delivery</strong>
                <p>Status: {order.status}</p>
                <span>{order.stock_released_at ? "Cancelled stock returned" : "Inventory allocated"}</span>
              </div>
            </div>

            <div className="invoice-items">
              <div className="invoice-item invoice-item-head">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
              </div>

              {items.map((item) => (
                <div className="invoice-item" key={item.id}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.variant_name ? `${item.variant_name}${item.variant_sku ? ` · ${item.variant_sku}` : ""}` : item.product_slug}</small>
                  </span>
                  <span>{item.quantity}</span>
                  <span>{formatPrice(Number(item.unit_price))}</span>
                  <strong>{formatPrice(Number(item.line_total ?? Number(item.unit_price) * Number(item.quantity)))}</strong>
                </div>
              ))}
            </div>

            <div className="invoice-totals">
              <div><span>Subtotal</span><strong>{formatPrice(Number(order.subtotal))}</strong></div>
              <div><span>Delivery</span><strong>{order.delivery_fee ? formatPrice(Number(order.delivery_fee)) : "Free"}</strong></div>
              <div className="invoice-grand-total"><span>Total</span><strong>{formatPrice(Number(order.total))}</strong></div>
            </div>

            <p className="invoice-footer">Thank you for shopping with MakranMart.</p>
          </section>

          <section className="order-admin-card no-print">
            <div className="order-card-heading">
              <div>
                <p className="mini-label">Fulfilment</p>
                <h2>Update order</h2>
              </div>
              <span className={`status-pill status-${order.status}`}>{order.status}</span>
            </div>

            <AdminOrderStatus orderId={order.id} status={order.status} detailed />
          </section>
        </div>

        <aside className="order-detail-side no-print">
          <section className="order-admin-card">
            <div className="order-card-heading">
              <div>
                <p className="mini-label">Customer</p>
                <h2>{order.customer_name}</h2>
              </div>
            </div>

            <div className="order-customer-details">
              <div><span>Phone</span><strong>{order.phone}</strong></div>
              <div><span>City</span><strong>{order.city}</strong></div>
              <div><span>Province</span><strong>{order.province}</strong></div>
              <div className="wide"><span>Address</span><strong>{order.address}</strong></div>
            </div>

            <a href={whatsapp} target="_blank" rel="noreferrer" className="primary-cta order-whatsapp">
              Message on WhatsApp <span>↗</span>
            </a>
          </section>

          <section className="order-admin-card">
            <div className="order-card-heading">
              <div>
                <p className="mini-label">History</p>
                <h2>Order timeline</h2>
              </div>
              <span>{events?.length || 0} updates</span>
            </div>

            <OrderTimeline events={events || []} />
          </section>
        </aside>
      </section>
    </main>
  );
}
