"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const transitions: Record<string, string[]> = {
  pending: ["pending", "confirmed", "cancelled"],
  confirmed: ["confirmed", "pending", "packed", "cancelled"],
  packed: ["packed", "confirmed", "shipped", "cancelled"],
  shipped: ["shipped", "packed", "delivered"],
  delivered: ["delivered", "shipped"],
  cancelled: ["cancelled", "pending"],
};

export function AdminOrderStatus({
  orderId,
  status,
  detailed = false,
}: {
  orderId: string;
  status: string;
  detailed?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [note, setNote] = useState("");
  const [customerVisible, setCustomerVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const availableStatuses = transitions[status] || [status];

  async function save(nextStatus = value, nextNote = note) {
    if (saving) return;

    if (nextStatus === "cancelled" && status !== "cancelled") {
      const confirmed = window.confirm(
        "Cancel this order? Its allocated stock will be returned to inventory."
      );
      if (!confirmed) {
        setValue(status);
        return;
      }
    }

    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        note: nextNote,
        customerVisible,
      }),
    });

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setValue(status);
      setMessage(result?.error || "Could not update order.");
      return;
    }

    setNote("");
    setMessage("Saved.");
    router.refresh();
  }

  if (!detailed) {
    return (
      <div className="admin-status-compact">
        <select
          className={`admin-status-select status-${value}`}
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            void save(next, next === "cancelled" ? "Order cancelled by MakranMart." : "");
          }}
          disabled={saving}
          aria-label="Order status"
        >
          {availableStatuses.map((item) => (
            <option value={item} key={item}>{item}</option>
          ))}
        </select>
        {message && message !== "Saved." && <small>{message}</small>}
      </div>
    );
  }

  return (
    <div className="order-status-editor">
      <div className="order-status-editor-top">
        <label>
          Order status
          <select
            className={`admin-status-select status-${value}`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={saving}
          >
            {availableStatuses.map((item) => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="order-note-field">
          Update note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder={
              value === "cancelled"
                ? "Reason for cancellation…"
                : "Optional update for the order timeline…"
            }
          />
        </label>
      </div>

      <div className="order-status-editor-foot">
        <label className="admin-check">
          <input
            type="checkbox"
            checked={customerVisible}
            onChange={(event) => setCustomerVisible(event.target.checked)}
          />
          <span>Show note in customer timeline</span>
        </label>

        <div>
          {message && (
            <span className={message === "Saved." ? "save-ok" : "save-error"}>
              {message}
            </span>
          )}
          <button
            type="button"
            className="primary-cta admin-save-button"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Update order"}
          </button>
        </div>
      </div>
    </div>
  );
}
