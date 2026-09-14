import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStorefrontProducts } from "@/lib/storefront";

export default async function WishlistPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/wishlist");

  const [{ data: saved }, products] = await Promise.all([
    supabase
      .from("makranmart_wishlist")
      .select("product_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getStorefrontProducts(),
  ]);

  const savedIds = new Set((saved || []).map((item) => item.product_id));
  const wishlistProducts = products.filter(
    (product) => product.id && savedIds.has(product.id)
  );

  return (
    <main>
      <Header />
      <section className="wishlist-shell">
        <div className="wishlist-heading">
          <p className="eyebrow">Saved for later</p>
          <h1>Your wishlist.</h1>
          <p>{wishlistProducts.length} saved {wishlistProducts.length === 1 ? "product" : "products"}</p>
        </div>

        {wishlistProducts.length ? (
          <div className="product-grid wishlist-grid">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="wishlist-empty">
            <span>♡</span>
            <h2>Nothing saved yet.</h2>
            <p>Use the heart on any product to keep it here for later.</p>
            <Link href="/products" className="primary-cta">Explore products <span>↗</span></Link>
          </div>
        )}
      </section>
    </main>
  );
}
