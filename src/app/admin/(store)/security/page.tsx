"use client";
import { FormEvent, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
export default function SecurityPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    const password = String(form.get("password") || "");
    if (password !== form.get("confirm")) { setMessage("The new passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { setMessage("Please sign in again."); return; }
      const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: String(form.get("current")) });
      if (authError) { setMessage("Your current password is incorrect."); return; }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setMessage(error.message); return; }
      element.reset(); setMessage("Your password has been changed.");
    } catch { setMessage("Could not change your password. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="admin-editor-shell"><header className="admin-editor-head"><div><p className="eyebrow">Owner account</p><h1>Change password</h1></div></header>
    <form className="admin-editor-card auth-form" onSubmit={submit}>
      <label>Current password<input name="current" type="password" autoComplete="current-password" required /></label>
      <label>New password<input name="password" type="password" minLength={12} autoComplete="new-password" required /></label>
      <label>Confirm new password<input name="confirm" type="password" minLength={12} autoComplete="new-password" required /></label>
      <p>Use at least 12 characters.</p><button className="primary-cta" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      {message && <p role="status">{message}</p>}
    </form>
  </main>;
}
