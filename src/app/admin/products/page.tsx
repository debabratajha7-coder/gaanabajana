"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatINR } from "@/lib/utils";
import { ImageDropzone } from "@/components/admin/ImageDropzone";
import Link from "next/link";
import { filterPublicCategories } from "@/lib/public-catalog";

type Cat = {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
};

type Brand = { _id: string; name: string };

type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  stock: number;
  brand?: { name?: string } | null;
  categories?: { name?: string }[];
};

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [parentId, setParentId] = useState("");
  const [childId, setChildId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("5");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function loadProducts() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }

  function loadCatalog() {
    fetch("/api/admin/catalog")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setBrands(d.brands || []);
      });
  }

  useEffect(() => {
    loadProducts();
    loadCatalog();
  }, []);

  const parents = useMemo(
    () => filterPublicCategories(categories.filter((c) => !c.parent)),
    [categories]
  );

  const children = useMemo(
    () =>
      categories.filter(
        (c) => c.parent && String(c.parent) === String(parentId)
      ),
    [categories, parentId]
  );

  async function ensureBrandId(): Promise<string | undefined> {
    if (brandId) return brandId;
    const name = newBrand.trim();
    if (!name) return undefined;
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "brand", name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not add brand");
    loadCatalog();
    return String(data.brand._id);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!parentId) {
      setError("Pick a main category (like Guitars).");
      return;
    }
    if (!title.trim()) {
      setError("Give the product a name.");
      return;
    }
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setError("Enter a selling price.");
      return;
    }
    if (!images.length) {
      setError("Add at least one product photo.");
      return;
    }

    setSaving(true);
    try {
      const resolvedBrand = await ensureBrandId();
      const categoryIds = childId ? [childId] : [parentId];
      const mrpNum = mrp ? Number(mrp) : priceNum;

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          brand: resolvedBrand,
          categories: categoryIds,
          description: description.trim(),
          images,
          price: priceNum,
          mrp: mrpNum,
          stock: Number(stock) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save product");

      setMsg("Product saved — it will show in the shop.");
      setTitle("");
      setPrice("");
      setMrp("");
      setStock("5");
      setDescription("");
      setImages([]);
      setChildId("");
      setBrandId("");
      setNewBrand("");
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadProducts();
  }

  return (
    <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
      <div>
        <h1 className="display text-3xl sm:text-4xl">Add a product</h1>
        <p className="mt-2 max-w-xl text-[var(--fg-muted)]">
          Follow the steps. Example: Guitars → Acoustic → Yamaha → name, price,
          photos — done.
        </p>

        <form onSubmit={onCreate} className="mt-8 space-y-8">
          <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Step 1 · What is it?
            </p>
            <label className="field-label" htmlFor="parent">
              Main category
            </label>
            <select
              id="parent"
              className="input"
              value={parentId}
              onChange={(e) => {
                setParentId(e.target.value);
                setChildId("");
              }}
              required
            >
              <option value="">Choose… (Guitars, Keyboards…)</option>
              {parents.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            {parentId && children.length > 0 && (
              <>
                <label className="field-label" htmlFor="child">
                  Type (optional but helpful)
                </label>
                <select
                  id="child"
                  className="input"
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                >
                  <option value="">Any / general</option>
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </section>

          <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Step 2 · Brand / company
            </p>
            <label className="field-label" htmlFor="brand">
              Brand
            </label>
            <select
              id="brand"
              className="input"
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value);
                if (e.target.value) setNewBrand("");
              }}
            >
              <option value="">Choose a brand…</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
            <p className="text-center text-xs text-[var(--fg-muted)]">or</p>
            <label className="field-label" htmlFor="newBrand">
              Type a new brand name
            </label>
            <input
              id="newBrand"
              className="input"
              placeholder="e.g. Casio"
              value={newBrand}
              onChange={(e) => {
                setNewBrand(e.target.value);
                if (e.target.value) setBrandId("");
              }}
            />
          </section>

          <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Step 3 · Name & price
            </p>
            <label className="field-label" htmlFor="title">
              Product name (heading)
            </label>
            <input
              id="title"
              className="input"
              placeholder="e.g. Yamaha F310 Acoustic Guitar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="field-label" htmlFor="price">
                  Selling price (₹)
                </label>
                <input
                  id="price"
                  className="input"
                  type="number"
                  min="1"
                  placeholder="9999"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="mrp">
                  Old price / MRP (optional)
                </label>
                <input
                  id="mrp"
                  className="input"
                  type="number"
                  min="0"
                  placeholder="Same as selling"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="stock">
                  How many in stock?
                </label>
                <input
                  id="stock"
                  className="input"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>
            <label className="field-label" htmlFor="description">
              Description (features, what’s included…)
            </label>
            <textarea
              id="description"
              className="input min-h-28"
              placeholder="Tell customers about this product in plain words."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </section>

          <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Step 4 · Photos
            </p>
            <p className="text-sm text-[var(--fg-muted)]">
              Drop 1–4 photos. First photo is the main shop picture.
            </p>
            <ImageDropzone
              values={images}
              onChange={setImages}
              multiple
              alt={title}
              label="Drop product photos here"
              aspect={1}
            />
          </section>

          {error && <p className="text-[var(--danger)]">{error}</p>}
          {msg && <p className="text-[var(--success)]">{msg}</p>}

          <button className="btn btn-primary w-full sm:w-auto" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save product"}
          </button>
        </form>
      </div>

      <div>
        <div className="flex items-end justify-between gap-3">
          <h2 className="display text-2xl">Your products</h2>
          <Link
            href="/admin/shop-by-category"
            className="text-sm text-[var(--accent)]"
          >
            Edit category photos →
          </Link>
        </div>
        <ul className="mt-4 max-h-[70vh] space-y-2 overflow-auto">
          {items.map((p) => (
            <li
              key={p._id}
              className="flex items-start justify-between gap-3 border border-[var(--line)] p-3 text-sm"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-[var(--fg-muted)]">
                  {p.brand?.name ? `${p.brand.name} · ` : ""}
                  {p.categories?.[0]?.name || "Uncategorized"} · {formatINR(p.price)} · stock{" "}
                  {p.stock}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-[var(--danger)]"
                onClick={() => remove(p._id)}
              >
                Delete
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-[var(--fg-muted)]">No products yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
