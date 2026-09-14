"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageDropzone } from "@/components/admin/ImageDropzone";
import { categoryImage } from "@/lib/catalog-media";
import { filterPublicCategories } from "@/lib/public-catalog";

type Cat = {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  image?: string;
};

export default function ShopByCategoryAdminPage() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [msg, setMsg] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

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

  async function saveName(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSavingId(id);
    setMsg("");
    await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", id, data: { name: trimmed } }),
    });
    setSavingId(null);
    setMsg("Saved");
    load();
  }

  async function saveImage(id: string, urls: string[]) {
    setSavingId(id);
    setMsg("");
    await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "category",
        id,
        data: { image: urls[0] || "" },
      }),
    });
    setSavingId(null);
    setMsg("Photo updated");
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="display text-3xl sm:text-4xl">Shop by category</h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        These tiles appear on your home page. Change the name or drop a new front
        photo for Guitars, Ukuleles, Keyboards, and so on.
      </p>
      {msg && <p className="mt-3 text-sm text-[var(--success)]">{msg}</p>}

      <div className="mt-8 space-y-6">
        {parents.map((c) => {
          const preview = categoryImage(c.slug, c.image);
          return (
            <article
              key={c._id}
              className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5"
            >
              <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                <div className="overflow-hidden border border-[var(--line)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="field-label" htmlFor={`name-${c._id}`}>
                      Name on the website
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`name-${c._id}`}
                        className="input"
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
            No categories yet. Run seed or add them from Brands tools.
          </p>
        )}
      </div>
    </div>
  );
}
