import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SellersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/sellers");

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  const { data: sellers } = await supabase
    .from("makranmart_sellers")
    .select("id, name, slug, location, contact_name, whatsapp, email, is_verified, is_active, makranmart_products(count)")
    .order("created_at", { ascending: false });

  return (
    <main className="admin-editor-shell">
      <header className="admin-list-head">
        <div>
          <p className="eyebrow">Marketplace management</p>
          <h1>Sellers</h1>
          <p>Manage the shops, artisans and businesses that appear across MakranMart.</p>
        </div>
        <div className="admin-list-actions">
          <Link href="/admin">← Dashboard</Link>
          <Link href="/admin/sellers/new" className="primary-cta">Add seller <span>+</span></Link>
        </div>
      </header>

      <section className="admin-list-card">
        <div className="admin-list-summary">
          <span>{sellers?.length || 0} sellers</span>
          <span>{sellers?.filter((seller) => seller.is_verified).length || 0} verified</span>
        </div>

        <div className="management-list">
          {(sellers || []).map((seller) => {
            const productCount = Array.isArray(seller.makranmart_products)
              ? Number(seller.makranmart_products[0]?.count || 0)
              : 0;

            return (
              <article className="management-row" key={seller.id}>
                <div className="management-avatar">{seller.name.slice(0, 1).toUpperCase()}</div>
                <div className="management-primary">
                  <div className="management-title-line">
                    <strong>{seller.name}</strong>
                    {seller.is_verified && <span className="verified-chip">Verified</span>}
                    {!seller.is_active && <span className="muted-chip">Hidden</span>}
                  </div>
                  <small>{seller.location || "Location not set"} · {productCount} products</small>
                </div>
                <div className="management-meta">
                  <small>{seller.contact_name || "No contact name"}</small>
                  <span>{seller.whatsapp || seller.email || "No contact details"}</span>
                </div>
                <Link className="management-edit" href={`/admin/sellers/${seller.id}/edit`}>Edit ↗</Link>
              </article>
            );
          })}

          {!sellers?.length && (
            <div className="management-empty">
              <h2>No sellers yet.</h2>
              <p>Add your first local shop or artisan to start building the marketplace.</p>
              <Link href="/admin/sellers/new" className="primary-cta">Add seller <span>↗</span></Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
