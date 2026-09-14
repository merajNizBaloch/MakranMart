"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function ClaimAdminButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function claim() {
    setLoading(true);
    setMessage("");

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.rpc("makranmart_claim_initial_admin");

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data) {
      setMessage("An administrator has already been created.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="claim-admin">
      <button className="primary-cta" onClick={claim} disabled={loading}>
        {loading ? "Setting up…" : "Make this account the first admin"} <span>↗</span>
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
