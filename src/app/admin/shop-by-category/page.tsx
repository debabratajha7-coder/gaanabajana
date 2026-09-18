"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ImageDropzone } from "@/components/admin/ImageDropzone";
import { categoryImage } from "@/lib/catalog-media";
import { filterPublicCategories } from "@/lib/public-catalog";
import { Plus, Trash2 } from "lucide-react";

type Cat = {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null | { _id?: string };
  image?: string;
  sortOrder?: number;
};

function parentIdOf(c: Cat): string | null {
  const raw = c.parent as unknown;
  if (raw == null || raw === "") return null;
  if (typeof raw === "object" && raw !== null && "_id" in raw) {
    return String((raw as { _id: unknown })._id);
  }
  return String(raw);
}

export default function ShopByCategoryAdminPage() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [subtypeDraft, setSubtypeDraft] = useState<Record<string, string>>({});
  const [addingSubtypeFor, setAddingSubtypeFor] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<Record<string, string>>({});

  function load() {
    fetch("/api/admin/catalog")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }

  useEffect(load, []);

  const parents = useMemo(
    () =>
      filterPublicCategories(
        categories.filter((c) => !parentIdOf(c)).map((c) => ({ ...c }))
      ),
    [categories]
  );

  function childrenOf(parentId: string) {
    return categories.filter((c) => parentIdOf(c) === String(parentId));
  }

  async function saveName(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSavingId(id);
    setMsg("");
    setError("");
    const res = await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", id, data: { name: trimmed } }),
    });
    setSavingId(null);
    if (!res.ok) {
      setError("Could not save name");
      return;
    }
    setMsg("Saved");
    load();
  }

  async function saveImage(id: string, urls: string[]) {
    setSavingId(id);
    setMsg("");
    setError("");
    const res = await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "category",
        id,
        data: { image: urls[0] || "" },
      }),
    });
    setSavingId(null);
    if (!res.ok) {
      setError("Could not update photo");
      return;
    }
    setMsg("Photo updated");
    load();
  }

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    const name = newName.trim();
    if (!name) {
      setError("Enter a category name.");
      return;
    }
    setAdding(true);
    try {
      const maxOrder = parents.reduce(
        (m, c) => Math.max(m, c.sortOrder ?? 0),
        0
      );
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          name,
          parent: null,
          image: newImage[0] || undefined,
          sortOrder: maxOrder + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add category");
      setNewName("");
      setNewImage([]);
      setMsg(
        `Added “${name}”. It shows as a homepage tile. Next: add subtypes like Strings or Accessories under it.`
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add category");
    } finally {
      setAdding(false);
    }
  }

  async function addSubtype(parent: Cat) {
    const name = (subtypeDraft[parent._id] || "").trim();
    if (!name) {
      setError(`Type a subtype name under ${parent.name} (e.g. Strings).`);
      return;
    }
    setAddingSubtypeFor(parent._id);
    setError("");
    setMsg("");
    try {
      const kids = childrenOf(parent._id);
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          name,
          parent: parent._id,
          sortOrder: kids.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add subtype");
      setSubtypeDraft((d) => ({ ...d, [parent._id]: "" }));
      setMsg(
        `Added “${name}” under ${parent.name}. When you add a product, pick ${parent.name} → ${name}.`
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add subtype");
    } finally {
      setAddingSubtypeFor(null);
    }
  }

  async function moveUnderParent(c: Cat, newParentId: string) {
    if (!newParentId || newParentId === c._id) {
      setError("Pick a different main category to move under.");
      return;
    }
    if (
      !confirm(
        `Move “${c.name}” under that main category? It will no longer be a homepage tile — it becomes a subtype (e.g. Acoustic under Guitars).`
      )
    ) {
      return;
    }
    setSavingId(c._id);
    setMsg("");
    setError("");
    try {
      // Move any existing subtypes of this category up first? Keep nested flat:
      // if c had kids, re-parent them to newParent too so we don't nest 3 levels.
      for (const kid of childrenOf(c._id)) {
        const resKid = await fetch("/api/admin/catalog", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "category",
            id: kid._id,
            data: { parent: newParentId },
          }),
        });
        if (!resKid.ok) throw new Error("Could not move a nested subtype");
      }
      const res = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: c._id,
          data: { parent: newParentId },
        }),
      });
      if (!res.ok) throw new Error("Could not move category");
      setMoveTarget((m) => ({ ...m, [c._id]: "" }));
      setMsg(
        `Moved “${c.name}” to a subtype. Use Products → Main → Subtype when tagging items.`
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move");
    } finally {
      setSavingId(null);
    }
  }

  async function removeCategory(c: Cat, isSubtype: boolean) {
    const kids = isSubtype ? 0 : childrenOf(c._id).length;
    const warn = isSubtype
      ? `Remove subtype “${c.name}”? Products using only this type may need a new category.`
      : kids > 0
        ? `Remove “${c.name}” and its ${kids} subtype${kids === 1 ? "" : "s"}?`
        : `Remove “${c.name}” from the shop?`;
    if (!confirm(warn)) return;

    setSavingId(c._id);
    setMsg("");
    setError("");
    try {
      if (!isSubtype) {
        for (const child of childrenOf(c._id)) {
          const res = await fetch("/api/admin/catalog", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "category", id: child._id }),
          });
          if (!res.ok) throw new Error("Could not remove a subtype");
        }
      }
      const res = await fetch("/api/admin/catalog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "category", id: c._id }),
      });
      if (!res.ok) throw new Error("Could not remove");
      setMsg(`Removed “${c.name}”.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="display text-3xl sm:text-4xl">Categories</h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        <strong className="font-semibold text-[var(--fg)]">Main categories</strong>{" "}
        are the big homepage tiles (Guitars, Keyboards…). Under each one, add{" "}
        <strong className="font-semibold text-[var(--fg)]">subtypes</strong> like
        Strings, Capos, or Accessories — then assign products to them.
      </p>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        Typical flow:{" "}
        <Link href="/admin/shop-by-category" className="underline">
          Categories
        </Link>{" "}
        →{" "}
        <Link href="/admin/brands" className="underline">
          Brands
        </Link>{" "}
        →{" "}
        <Link href="/admin/products" className="underline">
          Add product
        </Link>
        .
      </p>
      {msg && <p className="mt-3 text-sm text-[var(--success)]">{msg}</p>}
      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

      <form
        onSubmit={addCategory}
        className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5"
      >
        <h2 className="display text-xl">Add a main category (homepage tile)</h2>
        <p className="text-sm text-[var(--fg-muted)]">
          Only big groups here — Guitars, Keyboards, Drums.{" "}
          <strong className="font-medium text-[var(--fg)]">
            Do not add Acoustic / Bass / Ukulele here
          </strong>{" "}
          — add those as subtypes under Guitars below.
        </p>
        <div>
          <label className="field-label" htmlFor="new-cat-name">
            Name
          </label>
          <input
            id="new-cat-name"
            className="input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Accessories"
          />
        </div>
        <div>
          <p className="field-label">Tile photo (optional — PNG cutouts look best)</p>
          <ImageDropzone
            values={newImage}
            onChange={setNewImage}
            alt={newName || "New category"}
            label="Drop a photo here"
            aspect={4 / 3}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add main category"}
        </button>
      </form>

      <div className="mt-8 space-y-6">
        {parents.map((c) => {
          const preview = categoryImage(c.slug, c.image);
          const kids = childrenOf(c._id);
          return (
            <article
              key={c._id}
              className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5"
            >
              <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                <div className="overflow-hidden border border-[var(--line)] bg-[var(--bg-soft)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt=""
                    className="aspect-[4/3] w-full object-contain"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="field-label" htmlFor={`name-${c._id}`}>
                      Main category name (homepage)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        id={`name-${c._id}`}
                        className="input min-w-0 flex-1"
                        defaultValue={c.name}
                        key={`${c._id}-${c.name}`}
                        onBlur={(e) => {
                          if (e.target.value.trim() !== c.name) {
                            void saveName(c._id, e.target.value);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm shrink-0"
                        disabled={savingId === c._id}
                        onClick={() => {
                          const el = document.getElementById(
                            `name-${c._id}`
                          ) as HTMLInputElement | null;
                          if (el) void saveName(c._id, el.value);
                        }}
                      >
                        Save name
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm shrink-0 text-[var(--danger)]"
                        disabled={savingId === c._id}
                        onClick={() => void removeCategory(c, false)}
                      >
                        Remove
                      </button>
                    </div>
                    {parents.length > 1 && (
                      <div className="mt-3 rounded border border-dashed border-[var(--line-strong)] bg-[var(--bg-soft)] p-3">
                        <p className="text-xs text-[var(--fg-muted)]">
                          Added by mistake as a main tile? Move it under the real
                          type (e.g. move “acoustic guitar” → under Guitars).
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <select
                            className="input min-w-0 flex-1"
                            value={moveTarget[c._id] || ""}
                            onChange={(e) =>
                              setMoveTarget((m) => ({
                                ...m,
                                [c._id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">Move under…</option>
                            {parents
                              .filter((p) => p._id !== c._id)
                              .map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm shrink-0"
                            disabled={
                              savingId === c._id || !moveTarget[c._id]
                            }
                            onClick={() =>
                              void moveUnderParent(c, moveTarget[c._id])
                            }
                          >
                            Make subtype
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="field-label">Homepage tile photo</p>
                    <ImageDropzone
                      values={c.image ? [c.image] : []}
                      onChange={(urls) => void saveImage(c._id, urls)}
                      alt={c.name}
                      label="Drop a photo here"
                      aspect={4 / 3}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-[var(--line)] pt-5">
                <h3 className="text-sm font-semibold text-[var(--fg)]">
                  Subtypes under {c.name}
                </h3>
                <p className="mt-1 text-xs text-[var(--fg-muted)]">
                  Examples for Guitars: Acoustic, Electric, Bass, Electro
                  Acoustic, Classical. These show in Products → Subtype.
                </p>

                {kids.length > 0 ? (
                  <ul className="mt-3 divide-y divide-[var(--line)] border border-[var(--line)]">
                    {kids.map((k) => (
                      <li
                        key={k._id}
                        className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                      >
                        <input
                          className="input min-w-0 flex-1"
                          defaultValue={k.name}
                          key={`${k._id}-${k.name}`}
                          aria-label={`Rename ${k.name}`}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== k.name) {
                              void saveName(k._id, e.target.value);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="icon-btn h-9 w-9 text-[var(--danger)]"
                          aria-label={`Remove ${k.name}`}
                          disabled={savingId === k._id}
                          onClick={() => void removeCategory(k, true)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[var(--fg-muted)]">
                    No subtypes yet. Add “Strings” or “Accessories” below so
                    products can be filed neatly.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    className="input min-w-0 flex-1"
                    placeholder={`New subtype under ${c.name}…`}
                    value={subtypeDraft[c._id] || ""}
                    onChange={(e) =>
                      setSubtypeDraft((d) => ({
                        ...d,
                        [c._id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void addSubtype(c);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                    disabled={addingSubtypeFor === c._id}
                    onClick={() => void addSubtype(c)}
                  >
                    <Plus className="h-4 w-4" />
                    {addingSubtypeFor === c._id ? "Adding…" : "Add subtype"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {parents.length === 0 && (
          <p className="text-[var(--fg-muted)]">
            No categories yet. Use the form above to create the first homepage
            tile.
          </p>
        )}
      </div>
    </div>
  );
}
