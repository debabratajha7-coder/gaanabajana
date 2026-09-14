"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/utils";
import { Upload, X, Loader2 } from "lucide-react";

type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  stock: number;
  isActive: boolean;
};

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState({
    title: "",
    price: 999,
    mrp: 1299,
    stock: 10,
    description: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }

  useEffect(load, []);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;

    setUploading(true);
    setMsg("");
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("alt", form.title || file.name);
        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }
        if (data.media?.url) uploaded.push(data.media.url);
      }
      setImages((prev) => [...prev, ...uploaded]);
      setMsg(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded to Cloudinary`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (uploading) return;
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
        description: form.description,
        images,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg("Product created");
    setForm({ title: "", price: 999, mrp: 1299, stock: 10, description: "" });
    setImages([]);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete product?")) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Products</h1>
        <ul className="mt-6 max-h-[70vh] space-y-2 overflow-auto">
          {items.map((p) => (
            <li
              key={p._id}
              className="flex items-start justify-between gap-3 rounded-xl border border-[var(--line)] p-3 text-sm"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-[var(--fg-muted)]">
                  {formatINR(p.price)} · stock {p.stock} · /{p.slug}
                </p>
                <p className="mt-1 text-xs text-[var(--fg-muted)]">ID: {p._id}</p>
              </div>
              <button
                type="button"
                className="text-[var(--danger)]"
                onClick={() => remove(p._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={onCreate} className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Add product</h2>
        <input
          className="input"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            className="input"
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
          <input
            className="input"
            type="number"
            placeholder="MRP"
            value={form.mrp}
            onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
          />
          <input
            className="input"
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
          />
        </div>
        <textarea
          className="input min-h-24"
          placeholder="Description (HTML ok)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div>
          <p className="mb-2 text-sm text-[var(--fg-muted)]">Product images</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void uploadFiles(e.target.files);
            }}
          />
          <button
            type="button"
            className="btn btn-ghost w-full border-dashed"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
            }}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading to Cloudinary…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Choose images or drop here
              </>
            )}
          </button>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((url) => (
                <div
                  key={url}
                  className="relative overflow-hidden rounded-xl border border-[var(--line)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="aspect-square object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                    onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
        <button className="btn btn-primary" type="submit" disabled={uploading}>
          Create
        </button>
      </form>
    </div>
  );
}
