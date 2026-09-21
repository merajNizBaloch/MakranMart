"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Choice = { id: string; name: string };

type InitialProduct = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  badge: string | null;
  sku: string | null;
  image_url: string | null;
  category_id: string | null;
  seller_id: string | null;
  is_active: boolean;
  is_featured: boolean;
};

export function AdminProductForm({
  categories,
  initial,
}: {
  categories: Choice[];
  initial?: InitialProduct;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const editing = Boolean(initial?.id);

  const suggestedSlug = useMemo(
    () =>
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    [title]
  );

  async function uploadImage(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setMessage("Product images must be 4 MB or smaller.");
      return;
    }

    setUploading(true);
    setMessage("");

    const supabase = createBrowserSupabaseClient();
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const path = `products/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("makranmart-products")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      setUploading(false);
      setMessage(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("makranmart-products")
      .getPublicUrl(path);

    setImageUrl(data.publicUrl);
    setUploading(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || uploading) return;

    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") || "").trim(),
      slug: String(form.get("slug") || "").trim(),
      description: String(form.get("description") || "").trim(),
      price: Number(form.get("price")),
      compareAtPrice: form.get("compareAtPrice")
        ? Number(form.get("compareAtPrice"))
        : null,
      stock: Number(form.get("stock")),
      badge: String(form.get("badge") || "").trim(),
      sku: String(form.get("sku") || "").trim(),
      categoryId: String(form.get("categoryId") || ""),
      imageUrl: imageUrl || null,
      isActive: form.get("isActive") === "on",
      isFeatured: form.get("isFeatured") === "on",
    };

    setSaving(true);
    setMessage("");

    const response = await fetch(
      editing ? `/api/admin/products/${initial!.id}` : "/api/admin/products",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setMessage(result?.error || "Could not save product.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form className="admin-product-form" onSubmit={submit}>
      <div className="admin-form-grid">
        <label>
          Product title
          <input
            name="title"
            value={title}
            onChange={(event) => {
              const next = event.target.value;
              setTitle(next);
              if (!editing || slug === suggestedSlug) {
                setSlug(
                  next
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")
                );
              }
            }}
            required
          />
        </label>

        <label>
          URL slug
          <input
            name="slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="handmade-balochi-bag"
            required
          />
        </label>
      </div>

      <label>
        Description
        <textarea
          name="description"
          rows={5}
          defaultValue={initial?.description || ""}
          placeholder="Describe the product clearly."
        />
      </label>

      <div className="admin-form-grid three">
        <label>
          Price (Rs.)
          <input name="price" type="number" min="0" defaultValue={initial?.price ?? ""} required />
        </label>
        <label>
          Compare price
          <input name="compareAtPrice" type="number" min="0" defaultValue={initial?.compare_at_price ?? ""} />
        </label>
        <label>
          Stock
          <input name="stock" type="number" min="0" defaultValue={initial?.stock ?? 0} required />
        </label>
      </div>

      <div className="admin-form-grid">
        <label>
          Category
          <select name="categoryId" defaultValue={initial?.category_id || ""} required>
            <option value="" disabled>Select category</option>
            {categories.map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
        </label>

      </div>

      <div className="admin-form-grid">
        <label>
          SKU
          <input name="sku" defaultValue={initial?.sku || ""} placeholder="MM-CRAFT-001" />
        </label>
        <label>
          Badge
          <input name="badge" defaultValue={initial?.badge || ""} placeholder="Made in Balochistan" />
        </label>
      </div>

      <div className="admin-image-field">
        <div>
          <span className="admin-input-title">Product image</span>
          <p>JPG, PNG, WebP or AVIF. Maximum 4 MB.</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => uploadImage(event.target.files?.[0] || null)}
          />
        </div>
        <div
          className="admin-image-preview"
          style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
        >
          {!imageUrl && <span>MM</span>}
          {uploading && <small>Uploading…</small>}
        </div>
      </div>

      <div className="admin-check-row">
        <label className="admin-check">
          <input name="isActive" type="checkbox" defaultChecked={initial?.is_active ?? true} />
          <span>Visible in store</span>
        </label>
        <label className="admin-check">
          <input name="isFeatured" type="checkbox" defaultChecked={initial?.is_featured ?? false} />
          <span>Featured product</span>
        </label>
      </div>

      {message && <p className="admin-form-message">{message}</p>}

      <div className="admin-form-actions">
        <button type="button" className="secondary-cta" onClick={() => router.push("/admin")}>
          Cancel
        </button>
        <button className="primary-cta admin-save-button" disabled={saving || uploading}>
          {saving ? "Saving…" : editing ? "Save changes" : "Create product"} <span>↗</span>
        </button>
      </div>
    </form>
  );
}
