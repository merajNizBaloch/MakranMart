"use client";

import { FormEvent, useState } from "react";

type Rule = {
  region_key: string;
  name: string;
  fee: number;
  free_threshold: number | null;
  eta_min_days: number;
  eta_max_days: number;
  is_active: boolean;
};

export function AdminShippingRule({ rule }: { rule: Rule }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/admin/shipping/${rule.region_key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fee: Number(form.get("fee")),
        freeThreshold: form.get("freeThreshold")
          ? Number(form.get("freeThreshold"))
          : null,
        etaMinDays: Number(form.get("etaMinDays")),
        etaMaxDays: Number(form.get("etaMaxDays")),
        isActive: form.get("isActive") === "on",
      }),
    });

    const result = await response.json().catch(() => null);
    setSaving(false);
    setMessage(response.ok ? "Saved." : result?.error || "Could not save rule.");
  }

  return (
    <form className="shipping-rule-card" onSubmit={submit}>
      <div className="shipping-rule-title">
        <div>
          <span className="mini-label">Delivery zone</span>
          <h2>{rule.name}</h2>
        </div>
        <label className="admin-check">
          <input name="isActive" type="checkbox" defaultChecked={rule.is_active} />
          <span>Active</span>
        </label>
      </div>

      <div className="admin-form-grid two-small">
        <label>
          Delivery fee (Rs.)
          <input name="fee" type="number" min="0" defaultValue={rule.fee} required />
        </label>
        <label>
          Free delivery from (Rs.)
          <input
            name="freeThreshold"
            type="number"
            min="0"
            defaultValue={rule.free_threshold ?? ""}
            placeholder="No threshold"
          />
        </label>
      </div>

      <div className="admin-form-grid">
        <label>
          Minimum delivery days
          <input name="etaMinDays" type="number" min="0" defaultValue={rule.eta_min_days} required />
        </label>
        <label>
          Maximum delivery days
          <input name="etaMaxDays" type="number" min="0" defaultValue={rule.eta_max_days} required />
        </label>
      </div>

      <div className="shipping-rule-foot">
        {message && <span className={message === "Saved." ? "save-ok" : "save-error"}>{message}</span>}
        <button className="primary-cta admin-save-button" disabled={saving}>
          {saving ? "Saving…" : "Save rule"}
        </button>
      </div>
    </form>
  );
}
