import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminCategoryForm } from "@/components/AdminCategoryForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/categories/${id}/edit`);

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  const { data: category } = await supabase
    .from("makranmart_categories")
    .select("id, name, slug, description, sort_order, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!category) notFound();

  return (
    <main className="admin-editor-shell">
      <header className="admin-editor-head">
        <div>
          <p className="eyebrow">Catalog structure</p>
          <h1>Edit category</h1>
        </div>
        <Link href="/admin/categories">← Categories</Link>
      </header>
      <section className="admin-editor-card">
        <AdminCategoryForm initial={category} />
      </section>
    </main>
  );
}
