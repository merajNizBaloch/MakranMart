import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminProductForm } from "@/components/AdminProductForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=/admin/products/new");

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  const [{ data: categories }] = await Promise.all([
    supabase.from("makranmart_categories").select("id, name").order("name"),
  ]);

  return (
    <main className="admin-editor-shell">
      <header className="admin-editor-head">
        <div>
          <p className="eyebrow">Catalog management</p>
          <h1>Add product</h1>
        </div>
        <Link href="/admin">← Dashboard</Link>
      </header>

      <section className="admin-editor-card">
        <AdminProductForm categories={categories || []} />
      </section>
    </main>
  );
}
