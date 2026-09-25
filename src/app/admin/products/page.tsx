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
  parent?: string | null | { _id?: string };
  sortOrder?: number;
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

type ColorDraft = {
  key: string;
  name: string;
  swatch: string;
  images: string[];
};

type SpecDraft = {
  key: string;
  label: string;
  value: string;
};

/** Common instrument fields — admin can fill values or edit labels */
const COMMON_SPEC_LABELS = [
  "Number Of Strings",
  "Orientation",
  "Body Type",
  "Body Material",
  "Body Shape",
  "Body Finish",
  "Neck Material",
  "Neck Shape",
  "Neck Joint",
  "Radius (Inches)",
  "Fingerboard Material",
  "Fingerboard Inlay",
  "Number Of Frets",
  "Scale Length (Inches)",
  "Nut Material",
  "Nut Width (Mm)",
  "Bridge/ Tailpiece",
  "Bridge Pickup",
];

function emptyColor(): ColorDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    swatch: "#888888",
    images: [],
  };
}

function emptySpec(label = ""): SpecDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    value: "",
  };
}

/** Native <input type="color"> only accepts #rrggbb */
function normalizeHex(value: string, fallback = "#888888") {
  let s = value.trim();
  if (!s) return fallback;
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toLowerCase();
  return fallback;
}

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
  const [newSubtype, setNewSubtype] = useState("");
  const [addingSubtype, setAddingSubtype] = useState(false);
  const [renameSubtype, setRenameSubtype] = useState("");
  const [renamingSubtype, setRenamingSubtype] = useState(false);
  const [brandId, setBrandId] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("5");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<ColorDraft[]>([]);
  const [specs, setSpecs] = useState<SpecDraft[]>([]);
  const [essentialIds, setEssentialIds] = useState<string[]>([]);
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
    () =>
      filterPublicCategories(
        categories.filter((c) => {
          const p = c.parent;
          if (p == null || p === "") return true;
          return false;
        })
      ),
    [categories]
  );

  const children = useMemo(() => {
    if (!parentId) return [];
    return categories
      .filter((c) => {
        const raw = c.parent as unknown;
        if (raw == null || raw === "") return false;
        const id =
          typeof raw === "object" && raw !== null && "_id" in raw
            ? String((raw as { _id: unknown })._id)
            : String(raw);
        return id === String(parentId);
      })
      .slice()
      .sort((a, b) => {
        const sa = Number(a.sortOrder) || 0;
        const sb = Number(b.sortOrder) || 0;
        if (sa !== sb) return sa - sb;
        return a.name.localeCompare(b.name);
      });
  }, [categories, parentId]);

  const selectedChild = useMemo(
    () => children.find((c) => c._id === childId) || null,
    [children, childId]
  );

  useEffect(() => {
    setRenameSubtype(selectedChild?.name || "");
  }, [selectedChild?._id, selectedChild?.name]);

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
    setColorOptions([]);
    setSpecs([]);
    setEssentialIds([]);
    setReviewDrafts([]);
    setExistingReviews([]);
    setNewSubtype("");
    setRenameSubtype("");
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
    setColorOptions(
      ((p.colorOptions || []) as { name?: string; swatch?: string; images?: string[] }[]).map(
        (c, i) => ({
          key: `c-${i}-${c.name || i}`,
          name: c.name || "",
          swatch: c.swatch || "#888888",
          images: c.images || [],
        })
      )
    );
    setSpecs(
      ((p.specs || []) as { label?: string; value?: string }[]).map((s, i) => ({
        key: `s-${i}-${s.label || i}`,
        label: s.label || "",
        value: s.value || "",
      }))
    );
    setEssentialIds(
      ((p.essentials || []) as Array<{ _id?: string } | string>).map((e) =>
        typeof e === "string" ? e : String(e._id)
      )
    );
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

  async function addSubtypeQuick() {
    const name = newSubtype.trim();
    if (!parentId) {
      setError("Pick a main category first.");
      return;
    }
    if (!name) {
      setError("Type a subtype name (e.g. Acoustic).");
      return;
    }
    setAddingSubtype(true);
    setError("");
    setMsg("");
    try {
      const maxOrder = children.reduce(
        (m, c) => Math.max(m, Number(c.sortOrder) || 0),
        -1
      );
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          name,
          parent: parentId,
          sortOrder: maxOrder + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add subtype");
      setNewSubtype("");
      setChildId(String(data.category._id));
      setMsg(`Added subtype “${name}”.`);
      loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add subtype");
    } finally {
      setAddingSubtype(false);
    }
  }

  async function renameSubtypeQuick() {
    const name = renameSubtype.trim();
    if (!childId) {
      setError("Pick a subtype to rename.");
      return;
    }
    if (!name) {
      setError("Subtype name can’t be empty.");
      return;
    }
    if (selectedChild && name === selectedChild.name) {
      setMsg("Name unchanged.");
      return;
    }
    setRenamingSubtype(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: childId,
          data: { name, updateSlug: true },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not rename subtype");
      setMsg(`Renamed subtype to “${name}”.`);
      loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename");
    } finally {
      setRenamingSubtype(false);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!parentId) {
      setError("Pick a main category (like Guitars).");
      return;
    }
    if (children.length > 0 && !childId) {
      setError(
        "Pick a subtype (e.g. Acoustic Guitars or Bass under Guitars)."
      );
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

    const cleanedColors = colorOptions
      .map((c) => ({
        name: c.name.trim(),
        swatch: c.swatch.trim() || "#888888",
        images: c.images.filter(Boolean),
      }))
      .filter((c) => c.name);

    for (const c of cleanedColors) {
      if (!c.name) {
        setError("Each color needs a name.");
        return;
      }
    }

    const cleanedSpecs = specs
      .map((s) => ({
        label: s.label.trim(),
        value: s.value.trim(),
      }))
      .filter((s) => s.label || s.value);

    for (const s of cleanedSpecs) {
      if (!s.label || !s.value) {
        setError("Each spec needs both a label and a value.");
        return;
      }
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
        colorOptions: cleanedColors,
        specs: cleanedSpecs,
        essentials: essentialIds,
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
              Follow the numbered steps. First pick where it belongs (category +
              subtype), then brand, name, price, and photos.
            </p>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Missing a shelf like Strings?{" "}
              <Link href="/admin/shop-by-category" className="underline">
                Add it under Categories
              </Link>{" "}
              first, then come back here.
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
              Step 1 · Where does it belong?
            </p>
            <p className="text-sm text-[var(--fg-muted)]">
              Example: <strong className="font-medium text-[var(--fg)]">Guitars</strong>{" "}
              → subtype{" "}
              <strong className="font-medium text-[var(--fg)]">Acoustic</strong>{" "}
              or{" "}
              <strong className="font-medium text-[var(--fg)]">Bass</strong>.
              Don’t put Acoustic in the main list — add it under Guitars in{" "}
              <Link href="/admin/shop-by-category" className="underline">
                Categories
              </Link>
              .
            </p>
            <label className="field-label" htmlFor="parent">
              Main category (type)
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
            {parents.length === 0 && (
              <p className="text-sm text-[var(--danger)]">
                No categories yet.{" "}
                <Link href="/admin/shop-by-category" className="underline">
                  Create one in Categories
                </Link>{" "}
                first.
              </p>
            )}

            {parentId && children.length > 0 && (
              <>
                <label className="field-label" htmlFor="child">
                  Subtype (required) — Acoustic, Bass, Electric…
                </label>
                <select
                  id="child"
                  className="input"
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  required
                >
                  <option value="">Choose subtype…</option>
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--fg-muted)]">
                  Products are filed under the subtype so filters stay tidy.
                </p>
              </>
            )}

            {parentId && (
              <div className="rounded border border-[var(--line)] bg-[var(--bg-soft)] px-3 py-3 space-y-3">
                {childId && selectedChild ? (
                  <div>
                    <p className="text-xs font-medium text-[var(--fg)]">
                      Fix misspelled subtype
                    </p>
                    <p className="mt-1 text-xs text-[var(--fg-muted)]">
                      Rewrite the name for “{selectedChild.name}”, then save.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        className="input min-w-[12rem] flex-1"
                        value={renameSubtype}
                        onChange={(e) => setRenameSubtype(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void renameSubtypeQuick();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={
                          renamingSubtype ||
                          !renameSubtype.trim() ||
                          renameSubtype.trim() === selectedChild.name
                        }
                        onClick={() => void renameSubtypeQuick()}
                      >
                        {renamingSubtype ? "Saving…" : "Save rename"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-medium text-[var(--fg)]">
                    Missing a subtype?
                  </p>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">
                    Add it here without leaving this page (e.g. Acoustic under
                    Acoustic guitar).
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      className="input min-w-[12rem] flex-1"
                      placeholder="New subtype name…"
                      value={newSubtype}
                      onChange={(e) => setNewSubtype(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void addSubtypeQuick();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={addingSubtype || !newSubtype.trim()}
                      onClick={() => void addSubtypeQuick()}
                    >
                      {addingSubtype ? "Adding…" : "Add subtype"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {parentId && children.length === 0 && (
              <p className="rounded border border-[var(--line)] bg-[var(--bg-soft)] px-3 py-2.5 text-sm text-[var(--fg-muted)]">
                No subtypes yet — add one above, or manage the full tree in{" "}
                <Link
                  href="/admin/shop-by-category"
                  className="font-medium text-[var(--fg)] underline"
                >
                  Categories
                </Link>
                . You can still save under the main category for now.
              </p>
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
                  Show on homepage Best Sellers
                </span>
                <span className="mt-0.5 block text-[var(--fg-muted)]">
                  Only pinned products appear in Best Sellers for their
                  category. Leave off to keep this product off that section.
                </span>
              </span>
            </label>
          </section>

          <section className="space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Step 4 · Photos
            </p>
            <p className="text-sm text-[var(--fg-muted)]">
              Default photos (shown when no color is selected). First photo is
              the main shop picture. You can also reuse these for colors below —
              they won’t be deleted.
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
                Step 4b · Colors (optional)
              </p>
              <button
                type="button"
                className="btn btn-ghost inline-flex items-center gap-1.5 text-sm"
                onClick={() => setColorOptions((list) => [...list, emptyColor()])}
              >
                <Plus className="h-4 w-4" />
                Add color
              </button>
            </div>
            <p className="text-sm text-[var(--fg-muted)]">
              Add a name + swatch for each color. Photos are optional — if you
              skip them, the Step 4 gallery is used. Reuse Step 4 photos or
              upload new ones per color.
            </p>

            {colorOptions.length === 0 && (
              <p className="text-sm text-[var(--fg-muted)]">
                No colors — shoppers won’t see color circles on the card.
              </p>
            )}

            {colorOptions.map((c, idx) => (
              <div
                key={c.key}
                className="space-y-3 border border-[var(--line)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Color {idx + 1}</p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-[var(--danger)]"
                    onClick={() =>
                      setColorOptions((list) => list.filter((x) => x.key !== c.key))
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label className="field-label" htmlFor={`color-name-${c.key}`}>
                      Color name
                    </label>
                    <input
                      id={`color-name-${c.key}`}
                      className="input"
                      placeholder="e.g. Sunburst, Lake Placid Blue"
                      value={c.name}
                      onChange={(e) =>
                        setColorOptions((list) =>
                          list.map((x) =>
                            x.key === c.key ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor={`color-swatch-${c.key}`}>
                      Swatch
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-11 w-11 shrink-0 rounded-full border border-black/20 shadow-inner"
                        style={{ backgroundColor: normalizeHex(c.swatch) }}
                        title={normalizeHex(c.swatch)}
                        aria-hidden
                      />
                      {/*
                        Uncontrolled color input — controlled type=color breaks
                        the native picker in Chrome/Safari while dragging.
                      */}
                      <input
                        id={`color-swatch-${c.key}`}
                        type="color"
                        defaultValue={normalizeHex(c.swatch)}
                        className="h-11 w-14 cursor-pointer border border-[var(--line)] bg-white p-1"
                        ref={(el) => {
                          if (el && el.value !== normalizeHex(c.swatch)) {
                            // Keep native picker in sync when hex was typed
                            el.value = normalizeHex(c.swatch);
                          }
                        }}
                        onInput={(e) => {
                          const next = normalizeHex(
                            (e.target as HTMLInputElement).value
                          );
                          setColorOptions((list) =>
                            list.map((x) =>
                              x.key === c.key ? { ...x, swatch: next } : x
                            )
                          );
                        }}
                        onChange={(e) => {
                          const next = normalizeHex(e.target.value);
                          setColorOptions((list) =>
                            list.map((x) =>
                              x.key === c.key ? { ...x, swatch: next } : x
                            )
                          );
                        }}
                      />
                      <input
                        className="input w-28 font-mono text-sm"
                        value={c.swatch}
                        onChange={(e) =>
                          setColorOptions((list) =>
                            list.map((x) =>
                              x.key === c.key
                                ? { ...x, swatch: e.target.value }
                                : x
                            )
                          )
                        }
                        onBlur={(e) => {
                          const next = normalizeHex(e.target.value);
                          setColorOptions((list) =>
                            list.map((x) =>
                              x.key === c.key ? { ...x, swatch: next } : x
                            )
                          );
                        }}
                        placeholder="#888888"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <p className="field-label mb-0">Photos for this color</p>
                    {images.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          setColorOptions((list) =>
                            list.map((x) => {
                              if (x.key !== c.key) return x;
                              const merged = [...x.images];
                              for (const url of images) {
                                if (!merged.includes(url)) merged.push(url);
                              }
                              return { ...x, images: merged };
                            })
                          )
                        }
                      >
                        Use all Step 4 photos
                      </button>
                    )}
                  </div>

                  {images.length > 0 ? (
                    <div className="rounded border border-[var(--line)] bg-[var(--bg-soft)] p-3">
                      <p className="text-xs font-medium text-[var(--fg)]">
                        Already uploaded (Step 4) — click to add / remove for this
                        color
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                        Your Step 4 gallery stays intact either way.
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {images.map((url) => {
                          const used = c.images.includes(url);
                          return (
                            <button
                              key={url}
                              type="button"
                              title={
                                used
                                  ? "Remove from this color"
                                  : "Add to this color"
                              }
                              onClick={() =>
                                setColorOptions((list) =>
                                  list.map((x) => {
                                    if (x.key !== c.key) return x;
                                    if (used) {
                                      return {
                                        ...x,
                                        images: x.images.filter((u) => u !== url),
                                      };
                                    }
                                    return {
                                      ...x,
                                      images: [...x.images, url],
                                    };
                                  })
                                )
                              }
                              className={`relative overflow-hidden border-2 bg-white transition ${
                                used
                                  ? "border-[var(--accent)]"
                                  : "border-[var(--line)] opacity-80 hover:opacity-100"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt=""
                                className="aspect-square w-full object-contain"
                              />
                              <span
                                className={`absolute bottom-0 inset-x-0 py-0.5 text-center text-[10px] font-semibold ${
                                  used
                                    ? "bg-[var(--accent)] text-white"
                                    : "bg-black/55 text-white"
                                }`}
                              >
                                {used ? "Added ✓" : "Tap to use"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--fg-muted)]">
                      Upload default photos in Step 4 first if you want to reuse
                      them here.
                    </p>
                  )}

                  <div>
                    <p className="field-label">Or upload new photos for this color</p>
                    <ImageDropzone
                      values={c.images}
                      onChange={(urls) =>
                        setColorOptions((list) =>
                          list.map((x) =>
                            x.key === c.key ? { ...x, images: urls } : x
                          )
                        )
                      }
                      multiple
                      alt={c.name || `Color ${idx + 1}`}
                      label="Drop extra photos for this color"
                      aspect={1}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Step 4c · Specs (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    setSpecs((list) => {
                      const existing = new Set(
                        list.map((s) => s.label.trim().toLowerCase())
                      );
                      const extras = COMMON_SPEC_LABELS.filter(
                        (l) => !existing.has(l.toLowerCase())
                      ).map((label) => emptySpec(label));
                      return [...list, ...extras];
                    })
                  }
                >
                  Add guitar spec fields
                </button>
                <button
                  type="button"
                  className="btn btn-ghost inline-flex items-center gap-1.5 text-sm"
                  onClick={() => setSpecs((list) => [...list, emptySpec()])}
                >
                  <Plus className="h-4 w-4" />
                  Add row
                </button>
              </div>
            </div>
            <p className="text-sm text-[var(--fg-muted)]">
              Label on the left, value on the right — like Number Of Strings → 6.
              Leave empty if you don’t need specs.
            </p>

            {specs.length === 0 && (
              <p className="text-sm text-[var(--fg-muted)]">
                No specs yet. Use “Add guitar spec fields” for a ready list, or
                “Add row” for a custom line.
              </p>
            )}

            {specs.length > 0 && (
              <div className="space-y-2">
                {specs.map((s) => (
                  <div key={s.key} className="flex flex-wrap items-start gap-2">
                    <input
                      className="input min-w-0 flex-1"
                      placeholder="Label (e.g. Body Material)"
                      value={s.label}
                      onChange={(e) =>
                        setSpecs((list) =>
                          list.map((x) =>
                            x.key === s.key ? { ...x, label: e.target.value } : x
                          )
                        )
                      }
                    />
                    <input
                      className="input min-w-0 flex-1"
                      placeholder="Value (e.g. Poplar)"
                      value={s.value}
                      onChange={(e) =>
                        setSpecs((list) =>
                          list.map((x) =>
                            x.key === s.key ? { ...x, value: e.target.value } : x
                          )
                        )
                      }
                    />
                    <button
                      type="button"
                      className="icon-btn h-11 w-11 text-[var(--danger)]"
                      aria-label="Remove spec"
                      onClick={() =>
                        setSpecs((list) => list.filter((x) => x.key !== s.key))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Step 4d · Essentials (optional)
            </p>
            <p className="text-sm text-[var(--fg-muted)]">
              Pick products to show under “Essentials” on the product page. If
              you pick fewer than four, we auto-fill from accessories / same
              brand.
            </p>
            {items.filter((p) => p._id !== editingId).length === 0 ? (
              <p className="text-sm text-[var(--fg-muted)]">
                Save other products first, then come back to pick essentials.
              </p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto border border-[var(--line)] p-2">
                {items
                  .filter((p) => p._id !== editingId)
                  .map((p) => {
                    const checked = essentialIds.includes(p._id);
                    return (
                      <li key={p._id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[var(--bg-soft)]">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setEssentialIds((ids) =>
                                checked
                                  ? ids.filter((id) => id !== p._id)
                                  : ids.length >= 8
                                    ? ids
                                    : [...ids, p._id]
                              )
                            }
                          />
                          <span className="min-w-0 flex-1 truncate">{p.title}</span>
                          <span className="shrink-0 text-xs text-[var(--fg-muted)]">
                            {formatINR(p.price)}
                          </span>
                        </label>
                      </li>
                    );
                  })}
              </ul>
            )}
            {essentialIds.length > 0 && (
              <p className="text-xs text-[var(--fg-muted)]">
                {essentialIds.length} selected
                {essentialIds.length >= 8 ? " (max 8)" : ""}
              </p>
            )}
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
            Manage categories →
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
