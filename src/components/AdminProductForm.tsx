"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Choice = { id: string; name: string };
type VariantRow = { id?: string; name: string; sku: string; price: string; stock: string };

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
  gallery_urls?: string[] | null;
  specifications?: Record<string, unknown> | null;
  category_id: string | null;
  seller_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  makranmart_product_variants?: Array<{
    id: string;
    name: string;
    sku: string | null;
    price: number | null;
    stock: number;
    is_active: boolean;
    sort_order: number;
  }>;
};

function specsToText(specs?: Record<string, unknown> | null) {
  if (!specs) return "";
  return Object.entries(specs).map(([key, value]) => `${key}: ${String(value)}`).join("\n");
}

function parseSpecs(value: string) {
  const specs: Record<string, string> = {};
  value.split("\n").forEach((line) => {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.trim();
    const val = rest.join(":").trim();
    if (key && val) specs[key] = val;
  });
  return specs;
}

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
  const initialImages = Array.from(new Set([
    ...(initial?.gallery_urls || []),
    ...(initial?.image_url ? [initial.image_url] : []),
  ].filter(Boolean) as string[]));
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  const [variants, setVariants] = useState<VariantRow[]>(
    (initial?.makranmart_product_variants || [])
      .filter((item) => item.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku || "",
        price: item.price == null ? "" : String(item.price),
        stock: String(item.stock),
      }))
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const editing = Boolean(initial?.id);

  const suggestedSlug = useMemo(
    () => title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    [title]
  );

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    const chosen = Array.from(files);

    if (chosen.some((file) => !file.type.startsWith("image/"))) {
      setMessage("Please choose image files only.");
      return;
    }
    if (chosen.some((file) => file.size > 4 * 1024 * 1024)) {
      setMessage("Each product image must be 4 MB or smaller.");
      return;
    }

    setUploading(true);
    setMessage("");
    const supabase = createBrowserSupabaseClient();
    const uploaded: string[] = [];

    for (const file of chosen) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { error } = await supabase.storage.from("makranmart-products").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        setMessage(error.message);
        setUploading(false);
        return;
      }
      const { data } = supabase.storage.from("makranmart-products").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setImageUrls((current) => Array.from(new Set([...current, ...uploaded])));
    setUploading(false);
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string) {
    setVariants((current) =>
      current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)
    );
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
      compareAtPrice: form.get("compareAtPrice") ? Number(form.get("compareAtPrice")) : null,
      stock: Number(form.get("stock")),
      badge: String(form.get("badge") || "").trim(),
      sku: String(form.get("sku") || "").trim(),
      categoryId: String(form.get("categoryId") || ""),
      imageUrl: imageUrls[0] || null,
      galleryUrls: imageUrls,
      specifications: parseSpecs(String(form.get("specifications") || "")),
      variants: variants
        .filter((variant) => variant.name.trim())
        .map((variant, index) => ({
          id: variant.id,
          name: variant.name.trim(),
          sku: variant.sku.trim() || null,
          price: variant.price === "" ? null : Number(variant.price),
          stock: Number(variant.stock || 0),
          sortOrder: index,
        })),
      isActive: form.get("isActive") === "on",
      isFeatured: form.get("isFeatured") === "on",
      isNew: form.get("isNew") === "on",
      isBestseller: form.get("isBestseller") === "on",
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
                setSlug(next.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
              }
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
        <textarea name="description" rows={5} defaultValue={initial?.description || ""} placeholder="Describe the product clearly." />
      </label>

      <div className="admin-form-grid three">
        <label>Base price (Rs.)<input name="price" type="number" min="0" defaultValue={initial?.price ?? ""} required /></label>
        <label>Compare price<input name="compareAtPrice" type="number" min="0" defaultValue={initial?.compare_at_price ?? ""} /></label>
        <label>Base stock<input name="stock" type="number" min="0" defaultValue={initial?.stock ?? 0} required /><small>Used when no variants are configured.</small></label>
      </div>

      <div className="admin-form-grid">
        <label>
          Category
          <select name="categoryId" defaultValue={initial?.category_id || ""} required>
            <option value="" disabled>Select category</option>
            {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>SKU<input name="sku" defaultValue={initial?.sku || ""} placeholder="MM-CRAFT-001" /></label>
      </div>

      <label>Badge<input name="badge" defaultValue={initial?.badge || ""} placeholder="Made in Balochistan" /></label>

      <div className="admin-image-field admin-gallery-field">
        <div>
          <span className="admin-input-title">Product gallery</span>
          <p>Upload multiple JPG, PNG, WebP or AVIF images. First image is the primary image.</p>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => uploadImages(event.target.files)} />
        </div>
        <div className="admin-gallery-grid">
          {imageUrls.map((url, index) => (
            <div className="admin-gallery-item" key={url}>
              <span style={{ backgroundImage: `url("${url}")` }} />
              <small>{index === 0 ? "Primary" : `Image ${index + 1}`}</small>
              <button type="button" onClick={() => setImageUrls((current) => current.filter((item) => item !== url))}>Remove</button>
            </div>
          ))}
          {!imageUrls.length && <div className="admin-image-preview"><span>MM</span>{uploading && <small>Uploading…</small>}</div>}
        </div>
      </div>

      <label>
        Specifications
        <textarea name="specifications" rows={6} defaultValue={specsToText(initial?.specifications)} placeholder={"Material: Cotton\nOrigin: Balochistan\nWarranty: 1 year"} />
        <small>One specification per line using “Name: Value”.</small>
      </label>

      <section className="admin-variant-editor">
        <div className="admin-panel-head">
          <div>
            <span className="admin-input-title">Variants / options</span>
            <p>Add sizes, colors or other options with their own price and stock.</p>
          </div>
          <button type="button" className="secondary-cta" onClick={() => setVariants((current) => [...current, { name: "", sku: "", price: "", stock: "0" }])}>Add option +</button>
        </div>

        {variants.map((variant, index) => (
          <div className="admin-variant-row" key={variant.id || index}>
            <input value={variant.name} onChange={(event) => updateVariant(index, "name", event.target.value)} placeholder="e.g. Blue / Large" />
            <input value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} placeholder="SKU" />
            <input type="number" min="0" value={variant.price} onChange={(event) => updateVariant(index, "price", event.target.value)} placeholder="Price override" />
            <input type="number" min="0" value={variant.stock} onChange={(event) => updateVariant(index, "stock", event.target.value)} placeholder="Stock" />
            <button type="button" onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button>
          </div>
        ))}
      </section>

      <div className="admin-check-row">
        <label className="admin-check"><input name="isActive" type="checkbox" defaultChecked={initial?.is_active ?? true} /><span>Visible in store</span></label>
        <label className="admin-check"><input name="isFeatured" type="checkbox" defaultChecked={initial?.is_featured ?? false} /><span>Featured</span></label>
        <label className="admin-check"><input name="isNew" type="checkbox" defaultChecked={initial?.is_new ?? false} /><span>New arrival</span></label>
        <label className="admin-check"><input name="isBestseller" type="checkbox" defaultChecked={initial?.is_bestseller ?? false} /><span>Best seller</span></label>
      </div>

      {message && <p className="admin-form-message">{message}</p>}

      <div className="admin-form-actions">
        <button type="button" className="secondary-cta" onClick={() => router.push("/admin")}>Cancel</button>
        <button className="primary-cta admin-save-button" disabled={saving || uploading}>
          {saving ? "Saving…" : editing ? "Save changes" : "Create product"} <span>↗</span>
        </button>
      </div>
    </form>
  );
}
