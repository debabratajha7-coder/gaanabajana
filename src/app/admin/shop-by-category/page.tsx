"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ImageDropzone } from "@/components/admin/ImageDropzone";
import { categoryImage } from "@/lib/catalog-media";
import { filterPublicCategories } from "@/lib/public-catalog";

type Cat = {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  image?: string;
  sortOrder?: number;
};

export default function ShopByCategoryAdminPage() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  function load() {
    fetch("/api/admin/catalog")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }

  useEffect(load, []);

  const parents = useMemo(
    () =>
      filterPublicCategories(
        categories.filter((c) => !c.parent).map((c) => ({ ...c }))
      ),
    [categories]
  );

  function childCount(parentId: string) {
    return categories.filter((c) => c.parent && String(c.parent) === parentId)
      .length;
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
      setMsg(`Added “${name}”. It will show on the home page tiles.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add category");
    } finally {
      setAdding(false);
    }
  }

  async function removeCategory(c: Cat) {
    const kids = childCount(c._id);
    const warn =
      kids > 0
        ? `Remove “${c.name}” and its ${kids} sub-categor${kids === 1 ? "y" : "ies"}? Products linked only to these may need re-tagging.`
        : `Remove “${c.name}” from the shop?`;
    if (!confirm(warn)) return;

    setSavingId(c._id);
    setMsg("");
    setError("");
    try {
      const childIds = categories
        .filter((x) => x.parent && String(x.parent) === c._id)
        .map((x) => x._id);

      for (const id of childIds) {
        const res = await fetch("/api/admin/catalog", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "category", id }),
        });
        if (!res.ok) throw new Error("Could not remove a sub-category");
      }

      const res = await fetch("/api/admin/catalog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "category", id: c._id }),
      });
      if (!res.ok) throw new Error("Could not remove category");
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
      <h1 className="display text-3xl sm:text-4xl">Shop by category</h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        These tiles appear on your home page. Add or remove categories, rename
        them, or drop a front photo (PNG cutouts work best).
      </p>
      {msg && <p className="mt-3 text-sm text-[var(--success)]">{msg}</p>}
      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

      <form
        onSubmit={addCategory}
        className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5"
      >
        <h2 className="display text-xl">Add category</h2>
        <div>
          <label className="field-label" htmlFor="new-cat-name">
            Name
          </label>
          <input
            id="new-cat-name"
            className="input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Amplifiers"
          />
        </div>
        <div>
          <p className="field-label">Front photo (optional)</p>
          <ImageDropzone
            values={newImage}
            onChange={setNewImage}
            alt={newName || "New category"}
            label="Drop a photo here"
            aspect={4 / 3}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add category"}
        </button>
      </form>

      <div className="mt-8 space-y-6">
        {parents.map((c) => {
          const preview = categoryImage(c.slug, c.image);
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
                      Name on the website
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
                        onClick={() => void removeCategory(c)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="field-label">Front photo for this tile</p>
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
            </article>
          );
        })}
        {parents.length === 0 && (
          <p className="text-[var(--fg-muted)]">
            No categories yet. Use Add category above to create the first tile.
          </p>
        )}
      </div>
    </div>
  );
}
