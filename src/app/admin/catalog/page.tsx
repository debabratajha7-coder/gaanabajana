"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImageDropzone } from "@/components/admin/ImageDropzone";

type Cat = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
};

type BrandRow = {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
};

export default function AdminCatalogPage() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [catName, setCatName] = useState("");
  const [catImage, setCatImage] = useState<string[]>([]);
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

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
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "category",
        name: catName,
        image: catImage[0] || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMsg(data.error || "Failed to add category");
      return;
    }
    setCatName("");
    setCatImage([]);
    setMsg("Category added");
    load();
  }

  async function addBrand(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "brand",
        name: brandName,
        logo: brandLogo[0] || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMsg(data.error || "Failed to add brand");
      return;
    }
    setBrandName("");
    setBrandLogo([]);
    setMsg("Brand added");
    load();
  }

  async function updateCategoryImage(id: string, urls: string[]) {
    await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "category",
        id,
        data: { image: urls[0] || "" },
      }),
    });
    load();
  }

  async function updateBrandLogo(id: string, urls: string[]) {
    await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "brand",
        id,
        data: { logo: urls[0] || "" },
      }),
    });
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
    <div className="space-y-4">
      {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="display text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Drop a cover image for shop-by-category tiles (Guitars, Keys, etc.).
          </p>
          <form onSubmit={addCategory} className="mt-4 space-y-3">
            <input
              className="input"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="New category name"
              required
            />
            <ImageDropzone
              values={catImage}
              onChange={setCatImage}
              alt={catName}
              label="Drop category cover here"
            />
            <button className="btn btn-primary" type="submit">
              Add category
            </button>
          </form>
          <ul className="mt-6 space-y-6">
            {categories.map((c) => (
              <li key={c._id} className="border border-[var(--line)] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-[var(--fg-muted)]">/{c.slug}</p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-[var(--danger)]"
                    onClick={() => remove("category", c._id)}
                  >
                    Delete
                  </button>
                </div>
                <ImageDropzone
                  values={c.image ? [c.image] : []}
                  onChange={(urls) => void updateCategoryImage(c._id, urls)}
                  alt={c.name}
                  label="Drop cover image here"
                />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="display text-3xl">Brands</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Optional logo upload — storefront wordmarks use typography by default.
          </p>
          <form onSubmit={addBrand} className="mt-4 space-y-3">
            <input
              className="input"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="New brand name"
              required
            />
            <ImageDropzone
              values={brandLogo}
              onChange={setBrandLogo}
              alt={brandName}
              label="Drop brand logo here (optional)"
            />
            <button className="btn btn-primary" type="submit">
              Add brand
            </button>
          </form>
          <ul className="mt-6 space-y-6">
            {brands.map((b) => (
              <li key={b._id} className="border border-[var(--line)] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-[var(--fg-muted)]">/{b.slug}</p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-[var(--danger)]"
                    onClick={() => remove("brand", b._id)}
                  >
                    Delete
                  </button>
                </div>
                <ImageDropzone
                  values={b.logo ? [b.logo] : []}
                  onChange={(urls) => void updateBrandLogo(b._id, urls)}
                  alt={b.name}
                  label="Drop brand logo here"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
