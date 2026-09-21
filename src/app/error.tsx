"use client";
export default function StoreError({ reset }: { reset: () => void }) {
  return <main className="auth-shell"><section className="auth-card"><h1>We couldn’t load this page.</h1><p>Please try again in a moment.</p><button className="primary-cta" onClick={reset}>Try again</button></section></main>;
}
