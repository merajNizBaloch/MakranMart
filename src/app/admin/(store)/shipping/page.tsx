import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShippingRule } from "@/components/AdminShippingRule";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ShippingAdminPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=/admin/shipping");

  const { data: profile } = await supabase
    .from("makranmart_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  const { data: rules } = await supabase
    .from("makranmart_shipping_rules")
    .select("region_key, name, fee, free_threshold, eta_min_days, eta_max_days, is_active")
    .order("name");

  return (
    <main className="admin-editor-shell">
      <header className="admin-list-head">
        <div>
          <p className="eyebrow">Delivery settings</p>
          <h1>Shipping</h1>
          <p>Set delivery fees, free-delivery thresholds and estimated delivery times.</p>
        </div>
        <div className="admin-list-actions">
          <Link href="/admin">← Dashboard</Link>
        </div>
      </header>

      <section className="shipping-rules-grid">
        {(rules || []).map((rule) => (
          <AdminShippingRule key={rule.region_key} rule={rule} />
        ))}
      </section>
    </main>
  );
}
