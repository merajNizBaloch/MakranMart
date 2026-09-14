"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Supabase is not connected yet. Add the project environment variables first.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || "").trim();

    if (!email || password.length < 6) {
      setMessage("Enter a valid email and a password of at least 6 characters.");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      setLoading(false);
      if (error) return setMessage(error.message);
      setMessage("Account created. You can now sign in.");
      setMode("signin");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) return setMessage(error.message);

    const next = new URLSearchParams(window.location.search).get("next") || "/";
    window.location.href = next;
  }

  return (
    <main className="auth-shell">
      <Link href="/" className="brand auth-brand">
        <span className="brand-mark">M</span>
        <span>MakranMart</span>
      </Link>

      <section className="auth-card">
        <p className="eyebrow">{mode === "signin" ? "Welcome back" : "Join MakranMart"}</p>
        <h1>{mode === "signin" ? "Sign in to your account." : "Create your account."}</h1>
        <p className="auth-intro">
          Save your details, keep track of orders and shop faster across Pakistan.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <label>
              Full name
              <input name="fullName" type="text" placeholder="Your full name" required />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder="At least 6 characters" minLength={6} required />
          </label>

          <button className="place-order-button" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            <span>↗</span>
          </button>

          {message && <p className="auth-message">{message}</p>}
        </form>

        <button className="auth-switch" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
