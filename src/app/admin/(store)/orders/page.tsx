import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminOrderStatus } from "@/components/AdminOrderStatus";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/catalog";

const statuses = ["all", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=/admin/orders");

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  const { data: orders } = await supabase
    .from("makranmart_orders")
    .select("id, order_number, customer_name, phone, city, province, status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const q = String(params.q || "").trim().toLowerCase();
  const status = statuses.includes(String(params.status || "all"))
    ? String(params.status || "all")
    : "all";

  const filtered = (orders || []).filter((order) => {
    const matchesStatus = status === "all" || order.status === status;
    const matchesQuery =
      !q ||
      [
        order.order_number,
        order.customer_name,
        order.phone,
        order.city,
        order.province,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);

    return matchesStatus && matchesQuery;
  });

  const counts = (orders || []).reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="admin-editor-shell">
      <header className="admin-list-head">
        <div>
          <p className="eyebrow">Order operations</p>
          <h1>Orders</h1>
          <p>Review customer details, update fulfilment, contact buyers and print invoices.</p>
        </div>
        <div className="admin-list-actions">
          <Link href="/admin">← Dashboard</Link>
        </div>
      </header>

      <section className="order-filter-card">
        <form className="order-filter-form">
          <label>
            Search
            <input name="q" defaultValue={params.q || ""} placeholder="Order, customer, phone or city" />
          </label>
          <label>
            Status
            <select name="status" defaultValue={status}>
              {statuses.map((item) => (
                <option value={item} key={item}>
                  {item === "all" ? "All statuses" : item}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-cta" type="submit">Apply filters</button>
          {(q || status !== "all") && (
            <Link className="secondary-cta" href="/admin/orders">Clear</Link>
          )}
        </form>

        <div className="order-status-summary">
          <span>Showing {filtered.length} of {orders?.length || 0}</span>
          {statuses.slice(1).map((item) => (
            <span key={item}>{item}: {counts[item] || 0}</span>
          ))}
        </div>
      </section>

      <section className="admin-list-card order-list-card">
        <div className="admin-order-list-head">
          <span>Order</span>
          <span>Customer</span>
          <span>Status</span>
          <span>Total</span>
          <span />
        </div>

        <div className="admin-order-list">
          {filtered.map((order) => (
            <article className="admin-order-list-row" key={order.id}>
              <div>
                <Link href={`/admin/orders/${order.id}`} className="admin-order-number">
                  {order.order_number}
                </Link>
                <small>{new Date(order.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</small>
              </div>

              <div>
                <strong>{order.customer_name}</strong>
                <small>{order.city}, {order.province} · {order.phone}</small>
              </div>

              <AdminOrderStatus orderId={order.id} status={order.status} />

              <strong>{formatPrice(Number(order.total))}</strong>

              <Link className="management-edit" href={`/admin/orders/${order.id}`}>
                Open ↗
              </Link>
            </article>
          ))}

          {!filtered.length && (
            <div className="management-empty">
              <h2>No matching orders.</h2>
              <p>Try another customer, order number or status filter.</p>
              <Link href="/admin/orders" className="secondary-cta">Reset filters</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
