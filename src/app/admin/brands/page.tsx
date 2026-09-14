"use client";

import { FormEvent, useEffect, useState } from "react";

type Brand = { _id: string; name: string; slug: string };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/admin/catalog")
      .then((r) => r.json())
      .then((d) => setBrands(d.brands || []));
  }

  useEffect(load, []);

  async function addBrand(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "brand", name }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMsg(data.error || "Could not add brand");
      return;
    }
    setName("");
    setMsg("Brand added — you can pick it when adding a product.");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this brand?")) return;
    await fetch("/api/admin/catalog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "brand", id }),
    });
    load();
  }

  return (
    <div className="max-w-xl">
      <h1 className="display text-3xl sm:text-4xl">Brands</h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        Companies you sell — Fender, Yamaha, Casio, and so on. Add a name here,
        then choose it when you add a product.
      </p>

      <form onSubmit={addBrand} className="mt-8 flex gap-2">
        <input
          className="input"
          placeholder="Brand name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="btn btn-primary shrink-0" type="submit">
          Add
        </button>
      </form>
      {msg && <p className="mt-2 text-sm text-[var(--success)]">{msg}</p>}

      <ul className="mt-8 divide-y divide-[var(--line)] border border-[var(--line)]">
        {brands.map((b) => (
          <li key={b._id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="brand-mark text-xl not-italic text-[var(--fg)]">{b.name}</span>
            <button
              type="button"
              className="text-[var(--danger)]"
              onClick={() => remove(b._id)}
            >
              Remove
            </button>
          </li>
        ))}
        {brands.length === 0 && (
          <li className="px-4 py-3 text-[var(--fg-muted)]">No brands yet.</li>
        )}
      </ul>
    </div>
  );
}
