import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/catalog";
import { AdminOrderStatus } from "@/components/AdminOrderStatus";
import { AdminProductControls } from "@/components/AdminProductControls";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <main className="admin-shell">
        <div className="admin-top">
          <Link href="/" className="brand">
            <span className="brand-mark">M</span>
            <span>MakranMart</span>
          </Link>
        </div>
        <section className="admin-setup-card">
          <p className="eyebrow">Admin setup</p>
          <h1>Connect Supabase to activate the dashboard.</h1>
          <p>Add the MakranMart Supabase URL, anon key and service role key in your deployment environment.</p>
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return (
      <main className="admin-shell">
        <div className="admin-top">
          <Link href="/" className="brand">
            <span className="brand-mark">M</span>
            <span>MakranMart</span>
          </Link>
        </div>
        <section className="admin-setup-card">
          <p className="eyebrow">Restricted</p>
          <h1>This account does not have admin access.</h1>
          <p>Only MakranMart administrators can access products and orders.</p>
          <Link href="/" className="primary-cta">Return to store</Link>
        </section>
      </main>
    );
  }

  const [{ data: orders }, { data: dbProducts }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, customer_name, city, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("products")
      .select("id, title, stock, price, is_active")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const pending = orders?.filter((order) => order.status === "pending").length ?? 0;
  const revenue =
    orders
      ?.filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0) ?? 0;

  return (
    <main className="admin-shell">
      <header className="admin-top">
        <Link href="/" className="brand">
          <span className="brand-mark">M</span>
          <span>MakranMart</span>
        </Link>
        <div>
          <span className="mini-label">Administrator</span>
          <strong>{profile.full_name || user.email}</strong>
        </div>
      </header>

      <section className="admin-heading">
        <p className="eyebrow">Store operations</p>
        <h1>Dashboard</h1>
      </section>

      <section className="admin-stats">
        <article><span>Orders</span><strong>{orders?.length ?? 0}</strong><small>latest records</small></article>
        <article><span>Pending</span><strong>{pending}</strong><small>need attention</small></article>
        <article><span>Products</span><strong>{dbProducts?.length ?? 0}</strong><small>database catalog</small></article>
        <article><span>Order value</span><strong>{formatPrice(revenue)}</strong><small>excluding cancelled</small></article>
      </section>

      <section className="admin-grid">
        <div className="admin-panel">
          <div className="admin-panel-head"><h2>Recent orders</h2><span>Latest 20</span></div>
          <div className="admin-table">
            <div className="admin-table-row admin-table-labels"><span>Order</span><span>Customer</span><span>Status</span><span>Total</span></div>
            {(orders || []).map((order) => (
              <div className="admin-table-row" key={order.id}>
                <span><strong>{order.order_number}</strong><small>{order.city}</small></span>
                <span>{order.customer_name}</span>
                <AdminOrderStatus orderId={order.id} status={order.status} />
                <span>{formatPrice(Number(order.total || 0))}</span>
              </div>
            ))}
            {!orders?.length && <p className="admin-empty">No orders yet.</p>}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head"><h2>Inventory</h2><span>Live controls</span></div>
          <div className="admin-table admin-products-table">
            <div className="admin-table-row admin-table-labels"><span>Product</span><span>Inventory</span><span>Price</span></div>
            {(dbProducts || []).map((product) => (
              <div className="admin-table-row" key={product.id}>
                <span><strong>{product.title}</strong><small>{product.is_active ? "Visible in store" : "Hidden from store"}</small></span>
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
