import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminSellerForm } from "@/components/AdminSellerForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/sellers/${id}/edit`);

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  const { data: seller } = await supabase
    .from("makranmart_sellers")
    .select("id, name, slug, location, contact_name, phone, whatsapp, email, notes, is_verified, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!seller) notFound();

  return (
    <main className="admin-editor-shell">
      <header className="admin-editor-head">
        <div>
          <p className="eyebrow">Seller management</p>
          <h1>Edit seller</h1>
        </div>
        <Link href="/admin/sellers">← Sellers</Link>
      </header>
      <section className="admin-editor-card">
        <AdminSellerForm initial={seller} />
      </section>
    </main>
  );
}
