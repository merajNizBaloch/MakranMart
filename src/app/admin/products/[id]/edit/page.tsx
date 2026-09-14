import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminProductForm } from "@/components/AdminProductForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/products/${id}/edit`);

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  const [{ data: product }, { data: categories }, { data: sellers }] = await Promise.all([
    supabase
      .from("makranmart_products")
      .select("id, title, slug, description, price, compare_at_price, stock, badge, sku, image_url, category_id, seller_id, is_active, is_featured")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("makranmart_categories").select("id, name").order("name"),
    supabase.from("makranmart_sellers").select("id, name").order("name"),
  ]);

  if (!product) notFound();

  return (
    <main className="admin-editor-shell">
      <header className="admin-editor-head">
        <div>
          <p className="eyebrow">Catalog management</p>
          <h1>Edit product</h1>
        </div>
        <Link href="/admin">← Dashboard</Link>
      </header>

      <section className="admin-editor-card">
        <AdminProductForm categories={categories || []} sellers={sellers || []} initial={product} />
      </section>
    </main>
  );
}
