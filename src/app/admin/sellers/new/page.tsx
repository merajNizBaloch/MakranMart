import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSellerForm } from "@/components/AdminSellerForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewSellerPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/sellers/new");

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
          <p className="eyebrow">Seller onboarding</p>
          <h1>Add seller</h1>
        </div>
        <Link href="/admin/sellers">← Sellers</Link>
      </header>
      <section className="admin-editor-card">
        <AdminSellerForm />
      </section>
    </main>
  );
}
