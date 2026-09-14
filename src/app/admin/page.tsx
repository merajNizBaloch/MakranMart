import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/catalog";
import { AdminOrderStatus } from "@/components/AdminOrderStatus";
import { AdminProductControls } from "@/components/AdminProductControls";
import { ClaimAdminButton } from "@/components/ClaimAdminButton";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("makranmart_profiles")
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
          <Link href="/account" className="account-button">My account</Link>
        </div>
        <section className="admin-setup-card">
          <p className="eyebrow">Admin setup</p>
          <h1>Set up the MakranMart admin.</h1>
          <p>
            The first MakranMart account can claim administrator access once.
            After that, this setup action is permanently unavailable to other accounts.
          </p>
          <ClaimAdminButton />
        </section>
      </main>
    );
  }

  const [{ data: orders }, { data: dbProducts }] = await Promise.all([
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
        <div className="admin-top-actions">
          <Link href="/admin/products/new" className="primary-cta">Add product <span>+</span></Link>
          <Link href="/account" className="account-button">My account</Link>
        </div>
      </header>

      <section className="admin-heading">
        <p className="eyebrow">Store operations</p>
        <h1>Dashboard</h1>
        <p>Welcome, {profile.full_name || user.email}</p>
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
          <div className="admin-panel-head">
            <h2>Inventory</h2>
            <Link href="/admin/products/new">Add product ↗</Link>
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
