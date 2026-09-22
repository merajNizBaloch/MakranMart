"use client";

import { useMemo, useState } from "react";

export function ProductGallery({
  images,
  title,
  visual,
  badge,
}: {
  images: string[];
  title: string;
  visual: string;
  badge: string;
}) {
  const cleanImages = useMemo(() => Array.from(new Set(images.filter(Boolean))), [images]);
  const [active, setActive] = useState(0);
  const image = cleanImages[active];

  return (
    <div className="product-gallery">
      <div
        className={`detail-visual ${visual} ${image ? "has-product-image" : ""}`}
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
        role={image ? "img" : undefined}
        aria-label={image ? `${title} product image ${active + 1}` : undefined}
      >
        <span className="product-badge">{badge}</span>
        {!image && (
          <>
            <span className="detail-ring ring-one" />
            <span className="detail-ring ring-two" />
            <span className="detail-mark">MM</span>
          </>
        )}
      </div>

      {cleanImages.length > 1 && (
        <div className="product-gallery-thumbs" aria-label="Product images">
          {cleanImages.map((url, index) => (
            <button
              type="button"
              key={url}
              className={index === active ? "is-active" : ""}
              onClick={() => setActive(index)}
              aria-label={`Show product image ${index + 1}`}
              aria-pressed={index === active}
            >
              <span style={{ backgroundImage: `url("${url}")` }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
