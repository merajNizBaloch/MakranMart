"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

export function AdminOrderStatus({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function updateStatus(nextStatus: string) {
    setValue(nextStatus);
    setSaving(true);

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    setSaving(false);
    if (!response.ok) {
      setValue(status);
      return;
    }
    router.refresh();
  }

  return (
    <select
      className={`admin-status-select status-${value}`}
      value={value}
      onChange={(event) => updateStatus(event.target.value)}
      disabled={saving}
      aria-label="Order status"
    >
      {statuses.map((item) => (
        <option value={item} key={item}>{item}</option>
      ))}
    </select>
  );
}
