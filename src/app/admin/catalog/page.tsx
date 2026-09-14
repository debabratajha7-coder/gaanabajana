"use client";

import { FormEvent, useEffect, useState } from "react";

export default function AdminCatalogPage() {
  const [categories, setCategories] = useState<{ _id: string; name: string; slug: string }[]>(
    []
  );
  const [brands, setBrands] = useState<{ _id: string; name: string; slug: string }[]>([]);
  const [catName, setCatName] = useState("");
  const [brandName, setBrandName] = useState("");

  function load() {
    fetch("/api/admin/catalog")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setBrands(d.brands || []);
      });
  }

  useEffect(load, []);

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", name: catName }),
    });
    setCatName("");
    load();
  }

  async function addBrand(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "brand", name: brandName }),
    });
    setBrandName("");
    load();
  }

  async function remove(type: "category" | "brand", id: string) {
    await fetch("/api/admin/catalog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    load();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Categories</h1>
        <form onSubmit={addCategory} className="mt-4 flex gap-2">
          <input
            className="input"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="New category"
            required
          />
          <button className="btn btn-primary" type="submit">
            Add
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {categories.map((c) => (
            <li key={c._id} className="flex justify-between border-b border-[var(--line)] py-2">
              <span>
                {c.name} <span className="text-[var(--fg-muted)]">/{c.slug}</span>
              </span>
              <button
                type="button"
                className="text-[var(--danger)]"
                onClick={() => remove("category", c._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Brands</h2>
        <form onSubmit={addBrand} className="mt-4 flex gap-2">
          <input
            className="input"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="New brand"
            required
          />
          <button className="btn btn-primary" type="submit">
            Add
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {brands.map((b) => (
            <li key={b._id} className="flex justify-between border-b border-[var(--line)] py-2">
              <span>{b.name}</span>
              <button
                type="button"
                className="text-[var(--danger)]"
                onClick={() => remove("brand", b._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
