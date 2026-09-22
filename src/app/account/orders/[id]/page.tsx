import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { OrderTimeline } from "@/components/OrderTimeline";
import { PrintOrderButton } from "@/components/PrintOrderButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/catalog";

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/orders/${id}`);

  const [{ data: order }, { data: events }] = await Promise.all([
    supabase
      .from("makranmart_orders")
      .select("id, order_number, customer_name, phone, address, city, province, payment_method, status, subtotal, delivery_fee, total, created_at, updated_at, makranmart_order_items(id, product_slug, title, unit_price, quantity, line_total, variant_name, variant_sku)")
      .eq("id", id)
      .eq("customer_id", user.id)
      .maybeSingle(),
    supabase.rpc("makranmart_my_order_events", {
      p_order_id: id,
    }),
  ]);

  if (!order) notFound();

  const items = order.makranmart_order_items || [];

  return (
    <main>
      <div className="no-print">
        <Header />
      </div>

      <section className="customer-order-shell">
        <header className="customer-order-head no-print">
          <div>
            <p className="eyebrow">Your order</p>
            <h1>{order.order_number}</h1>
            <p>
              Placed {new Date(order.created_at).toLocaleString("en-PK", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          </div>

          <div className="order-detail-actions">
            <Link href="/account" className="secondary-cta">← My account</Link>
            <PrintOrderButton />
          </div>
        </header>

        <div className="customer-order-grid">
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
                <p>Current status: {order.status}</p>
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
                  <strong>
                    {formatPrice(
                      Number(item.line_total ?? Number(item.unit_price) * Number(item.quantity))
                    )}
                  </strong>
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

          <aside className="customer-order-timeline no-print">
            <div className="order-card-heading">
              <div>
                <p className="mini-label">Tracking</p>
                <h2>Order timeline</h2>
              </div>
              <span className={`status-pill status-${order.status}`}>{order.status}</span>
            </div>

            <OrderTimeline events={events || []} />
          </aside>
        </div>
      </section>
    </main>
  );
}
