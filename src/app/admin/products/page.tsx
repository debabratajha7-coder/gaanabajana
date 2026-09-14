"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import { ImageDropzone } from "@/components/admin/ImageDropzone";

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
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }

  useEffect(load, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
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
        <h1 className="display text-3xl">Products</h1>
        <ul className="mt-6 max-h-[70vh] space-y-2 overflow-auto">
          {items.map((p) => (
            <li
              key={p._id}
              className="flex items-start justify-between gap-3 border border-[var(--line)] p-3 text-sm"
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
        <h2 className="display text-2xl">Add product</h2>
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
          <p className="field-label">Product images</p>
          <ImageDropzone
            values={images}
            onChange={setImages}
            multiple
            alt={form.title}
            label="Drop product images here"
          />
        </div>

        {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
        <button className="btn btn-primary" type="submit">
          Create
        </button>
      </form>
    </div>
  );
}
