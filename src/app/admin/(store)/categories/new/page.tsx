import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCategoryForm } from "@/components/AdminCategoryForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewCategoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=/admin/categories/new");

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  return (
    <main className="admin-editor-shell">
      <header className="admin-editor-head">
        <div>
          <p className="eyebrow">Catalog structure</p>
          <h1>Add category</h1>
        </div>
        <Link href="/admin/categories">← Categories</Link>
      </header>
      <section className="admin-editor-card">
        <AdminCategoryForm />
      </section>
    </main>
  );
}
