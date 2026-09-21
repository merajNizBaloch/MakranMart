import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=/admin/categories");

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  const { data: categories } = await supabase
    .from("makranmart_categories")
    .select("id, name, slug, description, sort_order, is_active, makranmart_products(count)")
    .order("sort_order")
    .order("name");

  return (
    <main className="admin-editor-shell">
      <header className="admin-list-head">
        <div>
          <p className="eyebrow">Catalog structure</p>
          <h1>Categories</h1>
          <p>Control how products are grouped and displayed throughout the store.</p>
        </div>
        <div className="admin-list-actions">
          <Link href="/admin">← Dashboard</Link>
          <Link href="/admin/categories/new" className="primary-cta">Add category <span>+</span></Link>
        </div>
      </header>

      <section className="admin-list-card">
        <div className="admin-list-summary">
          <span>{categories?.length || 0} categories</span>
          <span>{categories?.filter((category) => category.is_active).length || 0} visible</span>
        </div>

        <div className="management-list">
          {(categories || []).map((category) => {
            const productCount = Array.isArray(category.makranmart_products)
              ? Number(category.makranmart_products[0]?.count || 0)
              : 0;

            return (
              <article className="management-row category-management-row" key={category.id}>
                <div className="management-order">{category.sort_order}</div>
                <div className="management-primary">
                  <div className="management-title-line">
                    <strong>{category.name}</strong>
                    {!category.is_active && <span className="muted-chip">Hidden</span>}
                  </div>
                  <small>/{category.slug} · {productCount} products</small>
                </div>
                <div className="management-meta">
                  <span>{category.description || "No description yet."}</span>
                </div>
                <Link className="management-edit" href={`/admin/categories/${category.id}/edit`}>Edit ↗</Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
