"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatINR } from "@/lib/utils";
import { ImageDropzone } from "@/components/admin/ImageDropzone";
import Link from "next/link";
import { filterPublicCategories } from "@/lib/public-catalog";
import { Plus, Trash2 } from "lucide-react";

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
  featured?: boolean;
  brand?: { name?: string; _id?: string } | null;
  categories?: { name?: string; _id?: string; parent?: string | null }[];
};

type ReviewDraft = {
  key: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
};

type ExistingReview = {
  _id: string;
  authorName?: string;
  rating: number;
  title?: string;
  body: string;
  approved: boolean;
};

function emptyReview(): ReviewDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    authorName: "",
    rating: 5,
    title: "",
    body: "",
  };
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentId, setParentId] = useState("");
  const [childId, setChildId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("5");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [reviewDrafts, setReviewDrafts] = useState<ReviewDraft[]>([]);
  const [existingReviews, setExistingReviews] = useState<ExistingReview[]>([]);
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

  function resetForm() {
    setEditingId(null);
    setParentId("");
    setChildId("");
    setBrandId("");
    setNewBrand("");
    setTitle("");
    setPrice("");
    setMrp("");
    setStock("5");
    setDescription("");
    setFeatured(false);
    setImages([]);
    setReviewDrafts([]);
    setExistingReviews([]);
  }

  async function startEdit(id: string) {
    setError("");
    setMsg("");
    const res = await fetch(`/api/admin/products?id=${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load product");
      return;
    }
    const p = data.product;
    const cats: { _id: string; parent?: string | null }[] = p.categories || [];
    const child = cats.find((c) => c.parent);
    const parent = cats.find((c) => !c.parent) || child;
    // If only child is set, resolve parent from catalog
    let nextParent = parent && !parent.parent ? parent._id : "";
    let nextChild = child?._id || "";
    if (child?.parent) {
      nextParent = String(child.parent);
      nextChild = child._id;
    } else if (cats[0] && !cats[0].parent) {
      nextParent = cats[0]._id;
      nextChild = "";
    }

    setEditingId(p._id);
    setParentId(nextParent);
    setChildId(nextChild);
    setBrandId(p.brand?._id || "");
    setNewBrand("");
    setTitle(p.title || "");
    setPrice(String(p.price ?? ""));
    setMrp(p.mrp && p.mrp !== p.price ? String(p.mrp) : "");
    setStock(String(p.stock ?? 0));
    setDescription(
      typeof p.description === "string"
        ? p.description.replace(/<[^>]+>/g, " ").trim()
        : ""
    );
    setFeatured(Boolean(p.featured));
    setImages(p.images || []);
    setExistingReviews(data.reviews || []);
    setReviewDrafts([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

  async function onSave(e: FormEvent) {
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

    const cleanedReviews = reviewDrafts
      .map((r) => ({
        authorName: r.authorName.trim(),
        rating: Number(r.rating) || 5,
        title: r.title.trim() || undefined,
        body: r.body.trim(),
      }))
      .filter((r) => r.authorName && r.body);

    for (const draft of reviewDrafts) {
      if ((draft.authorName.trim() || draft.body.trim()) && !(draft.authorName.trim() && draft.body.trim())) {
        setError("Each comment needs a name and the comment text.");
        return;
      }
    }

    setSaving(true);
    try {
      const resolvedBrand = await ensureBrandId();
      const categoryIds = childId ? [childId] : [parentId];
      const mrpNum = mrp ? Number(mrp) : priceNum;

      const payload = {
        title: title.trim(),
        brand: resolvedBrand,
        categories: categoryIds,
        description: description.trim(),
        images,
        price: priceNum,
        mrp: mrpNum,
        stock: Number(stock) || 0,
        featured,
        reviews: cleanedReviews.length ? cleanedReviews : undefined,
      };

      const res = await fetch("/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...payload } : payload
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save product");

      setMsg(
        editingId
          ? "Product updated."
          : "Product saved — it will show in the shop."
      );
      if (editingId) {
        await startEdit(editingId);
      } else {
        resetForm();
      }
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this product and its comments?")) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (editingId === id) resetForm();
    loadProducts();
  }

  async function removeReview(reviewId: string) {
    if (!confirm("Delete this comment?")) return;
    await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });
    setExistingReviews((list) => list.filter((r) => r._id !== reviewId));
    if (editingId) loadProducts();
  }

  function updateDraft(key: string, patch: Partial<ReviewDraft>) {
    setReviewDrafts((list) =>
      list.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  }

  return (
    <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-3xl sm:text-4xl">
              {editingId ? "Update product" : "Add a product"}
            </h1>
            <p className="mt-2 max-w-xl text-[var(--fg-muted)]">
              Follow the steps. You can also add shop comments that show on the
              product page.
            </p>
          </div>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              New product
            </button>
          )}
        </div>

        <form onSubmit={onSave} className="mt-8 space-y-8">
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
            <label className="flex cursor-pointer items-start gap-3 border border-[var(--line)] px-3 py-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span>
                <span className="block font-medium text-[var(--fg)]">
                  Show on homepage
                </span>
                <span className="mt-0.5 block text-[var(--fg-muted)]">
                  Appears in Bestsellers on the main page when checked.
                </span>
              </span>
            </label>
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

          <section className="space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Step 5 · Comments (optional)
              </p>
              <button
                type="button"
                className="btn btn-ghost inline-flex items-center gap-1.5 text-sm"
                onClick={() => setReviewDrafts((list) => [...list, emptyReview()])}
              >
                <Plus className="h-4 w-4" />
                Add comment
              </button>
            </div>
            <p className="text-sm text-[var(--fg-muted)]">
              Write shopper-style comments with a name and star rating. They go
              live on the product page when you save.
            </p>

            {editingId && existingReviews.length > 0 && (
              <ul className="space-y-2">
                {existingReviews.map((r) => (
                  <li
                    key={r._id}
                    className="flex items-start justify-between gap-3 border border-[var(--line)] p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        ★ {r.rating} · {r.authorName || "Customer"}
                        {!r.approved && (
                          <span className="ml-2 text-xs text-[var(--fg-muted)]">
                            (hidden)
                          </span>
                        )}
                      </p>
                      {r.title && <p className="mt-0.5">{r.title}</p>}
                      <p className="mt-1 text-[var(--fg-muted)]">{r.body}</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-[var(--danger)]"
                      onClick={() => removeReview(r._id)}
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {reviewDrafts.map((r, i) => (
              <div
                key={r.key}
                className="space-y-3 border border-[var(--line)] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">New comment {i + 1}</p>
                  <button
                    type="button"
                    className="text-sm text-[var(--danger)]"
                    onClick={() =>
                      setReviewDrafts((list) =>
                        list.filter((x) => x.key !== r.key)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
                  <div>
                    <label className="field-label">Reviewer name</label>
                    <input
                      className="input"
                      placeholder="e.g. Priya Nair"
                      value={r.authorName}
                      onChange={(e) =>
                        updateDraft(r.key, { authorName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">Stars</label>
                    <select
                      className="input"
                      value={r.rating}
                      onChange={(e) =>
                        updateDraft(r.key, { rating: Number(e.target.value) })
                      }
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="field-label">Title (optional)</label>
                  <input
                    className="input"
                    placeholder="Short headline"
                    value={r.title}
                    onChange={(e) =>
                      updateDraft(r.key, { title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="field-label">Comment</label>
                  <textarea
                    className="input min-h-24"
                    placeholder="Write like a real buyer…"
                    value={r.body}
                    onChange={(e) =>
                      updateDraft(r.key, { body: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}

            {reviewDrafts.length === 0 && existingReviews.length === 0 && (
              <p className="text-sm text-[var(--fg-muted)]">
                No comments yet — click “Add comment” if you want some.
              </p>
            )}
          </section>

          {error && <p className="text-[var(--danger)]">{error}</p>}
          {msg && <p className="text-[var(--success)]">{msg}</p>}

          <button
            className="btn btn-primary w-full sm:w-auto"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : editingId
                ? "Update product"
                : "Save product"}
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
              className={`flex items-start justify-between gap-3 border p-3 text-sm ${
                editingId === p._id
                  ? "border-[var(--accent)] bg-[var(--bg-elevated)]"
                  : "border-[var(--line)]"
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => startEdit(p._id)}
              >
                <p className="font-medium">{p.title}</p>
                <p className="text-[var(--fg-muted)]">
                  {p.brand?.name ? `${p.brand.name} · ` : ""}
                  {p.categories?.[0]?.name || "Uncategorized"} ·{" "}
                  {formatINR(p.price)} · stock {p.stock}
                  {p.featured ? " · Homepage" : ""}
                </p>
                <p className="mt-1 text-xs text-[var(--accent)]">Click to edit</p>
              </button>
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
