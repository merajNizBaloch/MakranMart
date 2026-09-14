"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export function AdminCategoryForm({ initial }: { initial?: Category }) {
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
      description: String(form.get("description") || "").trim(),
      sortOrder: Number(form.get("sortOrder") || 0),
      isActive: form.get("isActive") === "on",
    };

    setSaving(true);
    setMessage("");

    const response = await fetch(
      editing ? `/api/admin/categories/${initial!.id}` : "/api/admin/categories",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setMessage(result?.error || "Could not save category.");
      return;
    }

    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form className="admin-product-form" onSubmit={submit}>
      <div className="admin-form-grid">
        <label>
          Category name
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

      <label>
        Description
        <textarea name="description" rows={5} defaultValue={initial?.description || ""} placeholder="What shoppers will find in this category." />
      </label>

      <div className="admin-form-grid">
        <label>
          Sort order
          <input name="sortOrder" type="number" defaultValue={initial?.sort_order ?? 0} />
        </label>
        <label className="admin-check category-active-check">
          <input name="isActive" type="checkbox" defaultChecked={initial?.is_active ?? true} />
          <span>Visible category</span>
        </label>
      </div>

      {message && <p className="admin-form-message">{message}</p>}

      <div className="admin-form-actions">
        <button type="button" className="secondary-cta" onClick={() => router.push("/admin/categories")}>Cancel</button>
        <button className="primary-cta admin-save-button" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save category" : "Add category"} <span>↗</span>
        </button>
      </div>
    </form>
  );
}
