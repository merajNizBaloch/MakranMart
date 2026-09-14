"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Seller = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  contact_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  notes: string | null;
  is_verified: boolean;
  is_active: boolean;
};

export function AdminSellerForm({ initial }: { initial?: Seller }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const editing = Boolean(initial?.id);

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      slug: String(form.get("slug") || "").trim(),
      location: String(form.get("location") || "").trim(),
      contactName: String(form.get("contactName") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      whatsapp: String(form.get("whatsapp") || "").trim(),
      email: String(form.get("email") || "").trim(),
      notes: String(form.get("notes") || "").trim(),
      isVerified: form.get("isVerified") === "on",
      isActive: form.get("isActive") === "on",
    };

    setSaving(true);
    setMessage("");

    const response = await fetch(
      editing ? `/api/admin/sellers/${initial!.id}` : "/api/admin/sellers",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setMessage(result?.error || "Could not save seller.");
      return;
    }

    router.push("/admin/sellers");
    router.refresh();
  }

  return (
    <form className="admin-product-form" onSubmit={submit}>
      <div className="admin-form-grid">
        <label>
          Seller / business name
          <input
            name="name"
            value={name}
            onChange={(event) => {
              const next = event.target.value;
              setName(next);
              if (!editing) setSlug(slugify(next));
            }}
            required
          />
        </label>
        <label>
          URL slug
          <input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
        </label>
      </div>

      <div className="admin-form-grid">
        <label>
          Location
          <input name="location" defaultValue={initial?.location || ""} placeholder="Panjgur, Balochistan" />
        </label>
        <label>
          Contact person
          <input name="contactName" defaultValue={initial?.contact_name || ""} placeholder="Owner / manager name" />
        </label>
      </div>

      <div className="admin-form-grid three">
        <label>
          Phone
          <input name="phone" defaultValue={initial?.phone || ""} placeholder="03XX XXXXXXX" />
        </label>
        <label>
          WhatsApp
          <input name="whatsapp" defaultValue={initial?.whatsapp || ""} placeholder="03XX XXXXXXX" />
        </label>
        <label>
          Email
          <input name="email" type="email" defaultValue={initial?.email || ""} placeholder="seller@example.com" />
        </label>
      </div>

      <label>
        Internal notes
        <textarea name="notes" rows={5} defaultValue={initial?.notes || ""} placeholder="Onboarding, payment, pickup or verification notes…" />
      </label>

      <div className="admin-check-row">
        <label className="admin-check">
          <input name="isVerified" type="checkbox" defaultChecked={initial?.is_verified ?? false} />
          <span>Verified seller</span>
        </label>
        <label className="admin-check">
          <input name="isActive" type="checkbox" defaultChecked={initial?.is_active ?? true} />
          <span>Active seller</span>
        </label>
      </div>

      {message && <p className="admin-form-message">{message}</p>}

      <div className="admin-form-actions">
        <button type="button" className="secondary-cta" onClick={() => router.push("/admin/sellers")}>Cancel</button>
        <button className="primary-cta admin-save-button" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save seller" : "Add seller"} <span>↗</span>
        </button>
      </div>
    </form>
  );
}
