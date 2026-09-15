"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImageDropzone } from "@/components/admin/ImageDropzone";

type Brand = {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive?: boolean;
};

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/admin/catalog")
      .then((r) => r.json())
      .then((d) => setBrands(d.brands || []));
  }

  useEffect(load, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setLogo([]);
    setError("");
  }

  function startEdit(b: Brand) {
    setEditingId(b._id);
    setName(b.name);
    setLogo(b.logo ? [b.logo] : []);
    setMsg("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!name.trim()) {
      setError("Enter a brand name.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch("/api/admin/catalog", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "brand",
            id: editingId,
            data: {
              name: name.trim(),
              logo: logo[0] || "",
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not update brand");
        setMsg("Brand updated — logo will show on the home page.");
      } else {
        const res = await fetch("/api/admin/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "brand",
            name: name.trim(),
            logo: logo[0] || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not add brand");
        setMsg("Brand added. Upload a logo anytime by clicking the brand below.");
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this brand?")) return;
    await fetch("/api/admin/catalog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "brand", id }),
    });
    if (editingId === id) resetForm();
    load();
  }

  async function clearLogo(id: string) {
    await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "brand", id, data: { logo: "" } }),
    });
    if (editingId === id) setLogo([]);
    load();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-3xl sm:text-4xl">
              {editingId ? "Edit brand" : "Brands"}
            </h1>
            <p className="mt-2 text-[var(--fg-muted)]">
              Add the company name, then upload its logo. Logos show in the
              “Brands we stock” panel on the home page.
            </p>
          </div>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              New brand
            </button>
          )}
        </div>

        <form onSubmit={onSave} className="mt-8 space-y-6">
          <div>
            <label className="field-label" htmlFor="brandName">
              Brand name
            </label>
            <input
              id="brandName"
              className="input"
              placeholder="e.g. Fender"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <p className="field-label">Logo</p>
            <p className="mb-2 text-sm text-[var(--fg-muted)]">
              Prefer a PNG/SVG on a white or transparent background. Wide logos
              work best.
            </p>
            <ImageDropzone
              values={logo}
              onChange={setLogo}
              multiple={false}
              alt={name || "Brand logo"}
              label="Drop brand logo here"
              aspect={16 / 9}
            />
          </div>

          {error && <p className="text-[var(--danger)]">{error}</p>}
          {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving
              ? "Saving…"
              : editingId
                ? "Update brand"
                : "Add brand"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="display text-2xl">Your brands</h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Click a row to edit name or logo.
        </p>
        <ul className="mt-4 divide-y divide-[var(--line)] border border-[var(--line)]">
          {brands.map((b) => (
            <li
              key={b._id}
              className={`flex items-center gap-3 px-3 py-3 text-sm ${
                editingId === b._id ? "bg-[var(--bg-soft)]" : ""
              }`}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => startEdit(b)}
              >
                <span className="flex h-12 w-20 shrink-0 items-center justify-center border border-[var(--line)] bg-white p-1.5">
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.logo}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-neutral-400">No logo</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[var(--fg)]">
                    {b.name}
                  </span>
                  <span className="text-xs text-[var(--fg-muted)]">
                    /brands/{b.slug}
                  </span>
                </span>
              </button>
              <div className="flex shrink-0 flex-col gap-1">
                {b.logo && (
                  <button
                    type="button"
                    className="text-xs text-[var(--fg-muted)]"
                    onClick={() => clearLogo(b._id)}
                  >
                    Clear logo
                  </button>
                )}
                <button
                  type="button"
                  className="text-xs text-[var(--danger)]"
                  onClick={() => remove(b._id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
          {brands.length === 0 && (
            <li className="px-4 py-3 text-[var(--fg-muted)]">No brands yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
