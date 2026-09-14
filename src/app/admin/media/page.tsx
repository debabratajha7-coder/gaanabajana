"use client";

import { FormEvent, useEffect, useState } from "react";

type MediaItem = { _id: string; url: string; publicId: string; alt?: string };

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [configured, setConfigured] = useState(false);
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setConfigured(Boolean(d.configured));
      });
  }

  useEffect(load, []);

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const res = await fetch("/api/admin/media", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Upload failed");
      return;
    }
    setMsg("Uploaded");
    form.reset();
    load();
  }

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
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Media</h1>
      {!configured && (
        <p className="mt-3 text-sm text-[var(--danger)]">
          Cloudinary keys missing — add CLOUDINARY_* to .env.local
        </p>
      )}
      <form onSubmit={onUpload} className="mt-6 flex flex-wrap items-end gap-3">
        <input type="file" name="file" accept="image/*" required className="text-sm" />
        <input className="input max-w-xs" name="alt" placeholder="Alt text" />
        <button className="btn btn-primary" type="submit">
          Upload
        </button>
      </form>
      {msg && <p className="mt-2 text-sm text-[var(--success)]">{msg}</p>}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((m) => (
          <div key={m._id} className="overflow-hidden rounded-xl border border-[var(--line)]">
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
