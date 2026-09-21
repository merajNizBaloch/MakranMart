"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const [activate, setActivate] = useState(false);
  const [newAccount, setNewAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const setupCode = String(form.get("setupCode") || "").trim();
    const supabase = createBrowserSupabaseClient();
    try {
      const result = activate && newAccount
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) { setMessage(activate && newAccount ? result.error.message : "Unable to sign in. Check your email and password."); return; }
      if (!result.data.session) {
        setNewAccount(false);
        setMessage("Check your email to confirm your account. Then return here, sign in and enter your owner activation code.");
        return;
      }
      if (activate) {
        const { error } = await supabase.rpc("makranmart_activate_owner", { p_setup_code: setupCode });
        if (error) { await supabase.auth.signOut({ scope: "local" }); setMessage("Owner activation failed. Check the code; it may already have been used."); return; }
      }
      const { data: profile, error } = await supabase.from("makranmart_profiles").select("role").eq("id", result.data.user!.id).maybeSingle();
      if (error || profile?.role !== "admin") { await supabase.auth.signOut({ scope: "local" }); setMessage("This account does not have store admin access."); return; }
      const next = new URLSearchParams(window.location.search).get("next") || "/admin";
      window.location.assign(/^\/admin(?:\/|$)/.test(next) && !next.includes("\\") && !next.startsWith("/admin/login") ? next : "/admin");
    } catch { setMessage("We couldn’t connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell owner-auth">
    <Link href="/" className="brand auth-brand"><span className="brand-mark">M</span><span>MakranMart</span></Link>
    <section className="auth-card">
      <p className="eyebrow">Private store administration</p>
      <h1>{activate ? "Make the store yours." : "Welcome back, owner."}</h1>
      <p className="auth-intro">{activate ? "Use your one-time activation code to set up your owner account." : "Sign in to manage your products, stock and orders."}</p>
      <form className="auth-form" onSubmit={submit}>
        <label>Email<input name="email" type="email" autoComplete="username" required /></label>
        <label>Password<input name="password" type="password" autoComplete={activate && newAccount ? "new-password" : "current-password"} minLength={activate && newAccount ? 12 : 6} required /></label>
        {activate && <>
          <label>Owner activation code<input name="setupCode" type="password" autoComplete="off" required /></label>
          <label className="owner-checkbox"><input type="checkbox" checked={newAccount} onChange={event => setNewAccount(event.target.checked)} />Create a new account with this email</label>
          {newAccount && <small>Choose a password of at least 12 characters.</small>}
        </>}
        <button className="place-order-button" disabled={busy}>{busy ? "Please wait…" : activate ? "Activate owner access" : "Sign in to dashboard"}<span>↗</span></button>
        {message && <p className="auth-message" role="status">{message}</p>}
      </form>
      <button className="auth-switch" disabled={busy} onClick={() => { setActivate(!activate); setMessage(""); }}>{activate ? "Already activated? Sign in" : "First time? Activate owner access"}</button>
      <Link href="/" className="owner-back">← Back to the store</Link>
    </section>
  </main>;
}
