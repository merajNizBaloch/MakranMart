import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { SignOutButton } from "@/components/SignOutButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/catalog";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account");

  const [{ data: profile }, { data: orders }, { count: wishlistCount }] = await Promise.all([
    supabase
      .from("makranmart_profiles")
      .select("full_name, phone, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("makranmart_orders")
      .select("id, order_number, status, total, created_at, city, makranmart_order_items(title, quantity, unit_price)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("makranmart_wishlist")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return (
    <main>
      <Header />

      <section className="account-shell">
        <div className="account-heading">
          <div>
            <p className="eyebrow">Your MakranMart</p>
            <h1>{profile?.full_name || "My account"}</h1>
            <p>{user.email}</p>
          </div>
          <div className="account-actions">
            <Link href="/wishlist" className="secondary-cta">Wishlist ({wishlistCount || 0})</Link>
            {profile?.role === "admin" && <Link href="/admin" className="primary-cta">Admin dashboard <span>↗</span></Link>}
            <SignOutButton />
          </div>
        </div>

        <div className="account-grid">
          <aside className="account-profile-card">
            <span className="mini-label">Account</span>
            <div><small>Name</small><strong>{profile?.full_name || "Not set"}</strong></div>
            <div><small>Email</small><strong>{user.email}</strong></div>
            <div><small>Phone</small><strong>{profile?.phone || "Not set"}</strong></div>
            <Link href="/wishlist" className="account-side-link">
              <span>♡ Wishlist</span>
              <strong>{wishlistCount || 0}</strong>
            </Link>
          </aside>

          <section className="account-orders">
            <div className="account-section-head">
              <h2>Orders</h2>
              <span>{orders?.length || 0} total</span>
            </div>

            {!orders?.length ? (
              <div className="account-empty">
                <h3>No orders yet.</h3>
                <p>Products you order while signed in will appear here.</p>
                <Link href="/products" className="primary-cta">Start shopping <span>↗</span></Link>
              </div>
            ) : (
              <div className="account-order-list">
                {orders.map((order) => (
                  <article className="account-order-card" key={order.id}>
                    <div className="account-order-top">
                      <div>
                        <small>Order</small>
                        <strong><Link href={`/account/orders/${order.id}`}>{order.order_number}</Link></strong>
                      </div>
                      <span className={`status-pill status-${order.status}`}>{order.status}</span>
                    </div>

                    <div className="account-order-items">
                      {(order.makranmart_order_items || []).map((item, index) => (
                        <div key={`${order.id}-${index}`}>
                          <span>{item.title} × {item.quantity}</span>
                          <strong>{formatPrice(Number(item.unit_price) * Number(item.quantity))}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="account-order-foot">
                      <span>{new Date(order.created_at).toLocaleDateString("en-PK")} · {order.city}</span>
                      <div className="account-order-foot-actions">
                        <Link href={`/account/orders/${order.id}`}>Track order ↗</Link>
                        <strong>{formatPrice(Number(order.total))}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
