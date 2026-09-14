"use client";

import { useEffect, useState } from "react";
import { ImageDropzone } from "@/components/admin/ImageDropzone";

type MediaItem = { _id: string; url: string; publicId: string; alt?: string };

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [configured, setConfigured] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<string[]>([]);

  function load() {
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setConfigured(Boolean(d.configured));
      });
  }

  useEffect(load, []);

  async function remove(publicId: string) {
    if (!confirm("Delete image?")) return;
    await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
    load();
  }

  return (
    <div>
      <h1 className="display text-3xl">Media</h1>
      {!configured && (
        <p className="mt-3 text-sm text-[var(--danger)]">
          Cloudinary keys missing — add CLOUDINARY_* to .env.local
        </p>
      )}
      <div className="mt-6 max-w-xl">
        <ImageDropzone
          values={pending}
          onChange={(urls) => {
            setPending([]);
            if (urls.length) {
              setMsg("Uploaded to Cloudinary");
              load();
            }
          }}
          multiple
          label="Drop images here to upload to Cloudinary"
        />
      </div>
      {msg && <p className="mt-2 text-sm text-[var(--success)]">{msg}</p>}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((m) => (
          <div key={m._id} className="overflow-hidden border border-[var(--line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.alt || ""} className="aspect-square object-cover" />
            <div className="space-y-2 p-2 text-xs">
              <p className="truncate text-[var(--fg-muted)]">{m.url}</p>
              <button
                type="button"
                className="text-[var(--danger)]"
                onClick={() => remove(m.publicId)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
