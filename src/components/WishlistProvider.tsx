"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type WishlistContextValue = {
  ids: Set<string>;
  count: number;
  loading: boolean;
  toggle: (productId?: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setIds(new Set());
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("makranmart_wishlist")
        .select("product_id")
        .eq("user_id", user.id);

      if (!active) return;

      setIds(new Set((data || []).map((item) => item.product_id)));
      setLoading(false);
    }

    void load();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      void load();
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function toggle(productId?: string) {
    if (!productId) return;

    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const next = window.location.pathname + window.location.search;
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }

    const saved = ids.has(productId);

    setIds((current) => {
      const next = new Set(current);
      if (saved) next.delete(productId);
      else next.add(productId);
      return next;
    });

    if (saved) {
      const { error } = await supabase
        .from("makranmart_wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) {
        setIds((current) => new Set(current).add(productId));
      }
    } else {
      const { error } = await supabase
        .from("makranmart_wishlist")
        .insert({ user_id: user.id, product_id: productId });

      if (error) {
        setIds((current) => {
          const next = new Set(current);
          next.delete(productId);
          return next;
        });
      }
    }
  }

  const value = useMemo(
    () => ({ ids, count: ids.size, loading, toggle }),
    [ids, loading]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}
