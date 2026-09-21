import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminInventory } from "@/components/AdminInventory";
export default async function InventoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("makranmart_profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin/login");
  const { data, error } = await supabase.from("makranmart_products").select("id, title, sku, stock, price, is_active").order("created_at", { ascending: false }).limit(1000);
  if (error) throw new Error("Unable to load inventory.");
  return <main className="admin-shell"><header className="admin-editor-head"><div><p className="eyebrow">Your store catalog</p><h1>Products</h1></div><Link href="/admin/products/new" className="primary-cta">Add product +</Link></header><AdminInventory products={data || []} /></main>;
}
