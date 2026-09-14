"use client";

export function PrintOrderButton({ label = "Print invoice" }: { label?: string }) {
  return (
    <button
      type="button"
      className="secondary-cta print-order-button"
      onClick={() => window.print()}
    >
      {label} <span>↗</span>
    </button>
  );
}
