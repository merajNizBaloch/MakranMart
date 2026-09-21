import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Store Admin · MakranMart", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("makranmart_profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin/login?denied=1");
  return <div className="store-admin">
    <nav className="admin-section-nav" aria-label="Store administration">
      <Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/categories">Categories</Link><Link href="/admin/shipping">Shipping</Link><Link href="/admin/security">Password</Link><Link href="/">View store ↗</Link>
    </nav>{children}
  </div>;
}
