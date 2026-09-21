import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/catalog";
import { AdminOrderStatus } from "@/components/AdminOrderStatus";
import { AdminProductControls } from "@/components/AdminProductControls";
import { SignOutButton } from "@/components/SignOutButton";

type Analytics = {
  totalOrders?: number;
  activeOrders?: number;
  deliveredOrders?: number;
  cancelledOrders?: number;
  grossOrderValue?: number;
  deliveredRevenue?: number;
  last30DaysValue?: number;
  averageOrderValue?: number;
  unitsOrdered?: number;
  statusCounts?: Record<string, number>;
  topProducts?: Array<{
    slug: string;
    title: string;
    quantity: number;
    value: number;
  }>;
  dailySales?: Array<{
    date: string;
    orders: number;
    value: number;
  }>;
};

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login?next=/admin");

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin/login?denied=1");

  const [
    { data: orders },
    { data: dbProducts },
    { data: analyticsData },
  ] = await Promise.all([
    supabase
      .from("makranmart_orders")
      .select("id, order_number, customer_name, city, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("makranmart_products")
      .select("id, slug, title, stock, price, is_active, image_url")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.rpc("makranmart_admin_sales_analytics"),
  ]);

  const analytics = (analyticsData || {}) as Analytics;
  const dailySales = analytics.dailySales || [];
  const topProducts = analytics.topProducts || [];
  const statusCounts = analytics.statusCounts || {};
  const maxDailyValue = Math.max(1, ...dailySales.map((day) => Number(day.value || 0)));

  return (
    <main className="admin-shell">
      <header className="admin-top">
        <Link href="/" className="brand">
          <span className="brand-mark">M</span>
          <span>MakranMart</span>
        </Link>
        <div className="admin-top-actions">
          <Link href="/admin/orders" className="secondary-cta">Orders</Link>
          <Link href="/admin/products/new" className="primary-cta">Add product <span>+</span></Link>
          <Link href="/admin/security" className="account-button">Password</Link><SignOutButton />
        </div>
      </header>

      <section className="admin-heading">
        <p className="eyebrow">Store operations</p>
        <h1>Dashboard</h1>
        <p>Welcome, {profile.full_name || user.email}</p>
      </section>

      <section className="admin-stats">
        <article>
          <span>Total orders</span>
          <strong>{analytics.totalOrders || 0}</strong>
          <small>{analytics.activeOrders || 0} currently active</small>
        </article>
        <article>
          <span>Delivered revenue</span>
          <strong>{formatPrice(Number(analytics.deliveredRevenue || 0))}</strong>
          <small>{analytics.deliveredOrders || 0} delivered orders</small>
        </article>
        <article>
          <span>Last 30 days</span>
          <strong>{formatPrice(Number(analytics.last30DaysValue || 0))}</strong>
          <small>non-cancelled order value</small>
        </article>
        <article>
          <span>Average order</span>
          <strong>{formatPrice(Number(analytics.averageOrderValue || 0))}</strong>
          <small>{analytics.unitsOrdered || 0} units ordered</small>
        </article>
      </section>

      <section className="admin-management-links">
        <Link href="/admin/orders">
          <span>01</span>
          <div><strong>Manage orders</strong><small>Open invoices, customer details, timelines and fulfilment.</small></div>
          <b>↗</b>
        </Link>
        <Link href="/admin/products/new">
          <span>02</span>
          <div><strong>Add product</strong><small>Create a new listing with image, price and stock.</small></div>
          <b>↗</b>
        </Link>
        <Link href="/admin/categories">
          <span>04</span>
          <div><strong>Manage categories</strong><small>Organize storefront navigation and visibility.</small></div>
          <b>↗</b>
        </Link>
        <Link href="/admin/shipping">
          <span>05</span>
          <div><strong>Shipping rules</strong><small>Set fees, free-delivery thresholds and delivery times.</small></div>
          <b>↗</b>
        </Link>
      </section>

      <section className="admin-analytics-grid">
        <article className="admin-analytics-card sales-trend-card">
          <div className="admin-panel-head">
            <div>
              <p className="mini-label">Sales analytics</p>
              <h2>Recent order value</h2>
            </div>
            <span>Last 14 days</span>
          </div>

          <div className="sales-bars">
            {dailySales.length ? dailySales.map((day) => {
              const height = Math.max(8, Math.round((Number(day.value || 0) / maxDailyValue) * 100));
              return (
                <div className="sales-bar-column" key={day.date} title={formatPrice(Number(day.value || 0))}>
                  <div className="sales-bar-track">
                    <i style={{ height: `${height}%` }} />
                  </div>
                  <strong>{day.orders}</strong>
                  <span>{new Date(day.date + "T00:00:00").toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>
                </div>
              );
            }) : (
              <div className="analytics-empty">Sales activity will appear here after orders are placed.</div>
            )}
          </div>
        </article>

        <article className="admin-analytics-card">
          <div className="admin-panel-head">
            <div>
              <p className="mini-label">Products</p>
              <h2>Bestselling products</h2>
            </div>
            <span>By order value</span>
          </div>

          <div className="top-product-list">
            {topProducts.map((product, index) => (
              <div className="top-product-row" key={product.slug}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{product.title}</strong>
                  <small>{product.quantity} units</small>
                </div>
                <b>{formatPrice(Number(product.value || 0))}</b>
              </div>
            ))}
            {!topProducts.length && <div className="analytics-empty">No product sales yet.</div>}
          </div>
        </article>

        <article className="admin-analytics-card">
          <div className="admin-panel-head">
            <div>
              <p className="mini-label">Operations</p>
              <h2>Status overview</h2>
            </div>
          </div>

          <div className="status-analytics-list">
            {["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"].map((status) => (
              <div key={status}>
                <span className={`status-pill status-${status}`}>{status}</span>
                <strong>{statusCounts[status] || 0}</strong>
              </div>
            ))}
          </div>

          <div className="analytics-metrics">
            <div><span>Gross order value</span><strong>{formatPrice(Number(analytics.grossOrderValue || 0))}</strong></div>
            <div><span>Cancelled orders</span><strong>{analytics.cancelledOrders || 0}</strong></div>
          </div>
        </article>
      </section>

      <section className="admin-grid">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Recent orders</h2>
            <Link href="/admin/orders">View all orders ↗</Link>
          </div>
          <div className="admin-table">
            <div className="admin-table-row admin-table-labels"><span>Order</span><span>Customer</span><span>Status</span><span>Total</span></div>
            {(orders || []).map((order) => (
              <div className="admin-table-row" key={order.id}>
                <span>
                  <strong><Link href={`/admin/orders/${order.id}`}>{order.order_number}</Link></strong>
                  <small>{order.city}</small>
                </span>
                <span>{order.customer_name}</span>
                <AdminOrderStatus orderId={order.id} status={order.status} />
                <span>{formatPrice(Number(order.total || 0))}</span>
              </div>
            ))}
            {!orders?.length && <p className="admin-empty">No orders yet.</p>}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Inventory</h2>
            <Link href="/admin/products">View all products ↗</Link>
          </div>
          <div className="admin-table admin-products-table">
            <div className="admin-table-row admin-table-labels"><span>Product</span><span>Inventory</span><span>Price</span></div>
            {(dbProducts || []).map((product) => (
              <div className="admin-table-row" key={product.id}>
                <span className="admin-product-cell">
                  <span
                    className="admin-product-thumb"
                    style={product.image_url ? { backgroundImage: `url("${product.image_url}")` } : undefined}
                  >
                    {!product.image_url && "MM"}
                  </span>
                  <span>
                    <strong>{product.title}</strong>
                    <small>{product.is_active ? "Visible in store" : "Hidden from store"} · <Link href={`/admin/products/${product.id}/edit`}>Edit</Link></small>
                  </span>
                </span>
                <AdminProductControls productId={product.id} stock={Number(product.stock)} active={Boolean(product.is_active)} />
                <span>{formatPrice(Number(product.price || 0))}</span>
              </div>
            ))}
            {!dbProducts?.length && <p className="admin-empty">No database products yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
