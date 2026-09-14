"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ImageDropzone } from "@/components/admin/ImageDropzone";
import Link from "next/link";
import { filterPublicCategories } from "@/lib/public-catalog";

type Settings = Record<string, string | number>;
type Page = { key: string; title: string; body: string };
type Cat = { _id: string; name: string; slug: string; parent?: string | null; image?: string };

const PAGE_LABELS: Record<string, string> = {
  about: "About us",
  faqs: "FAQs",
  contact: "Contact page",
  shipping: "Shipping policy",
  returns: "Returns policy",
  warranty: "Warranty",
  privacy: "Privacy policy",
  terms: "Terms",
};

function Field({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 text-xs text-[var(--fg-muted)]">{hint}</p>}
    </div>
  );
}

export default function AdminSitePage() {
  const [settings, setSettings] = useState<Settings>({});
  const [pages, setPages] = useState<Page[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [activeKey, setActiveKey] = useState("about");
  const [pageForm, setPageForm] = useState({ title: "", body: "" });
  const [msg, setMsg] = useState("");
  const [section, setSection] = useState<
    "store" | "banner" | "home" | "shipping" | "pages" | "categories"
  >("store");

  function load() {
    Promise.all([
      fetch("/api/admin/cms").then((r) => r.json()),
      fetch("/api/admin/catalog").then((r) => r.json()),
    ]).then(([cms, catalog]) => {
      const raw = cms.settings || {};
      const social = raw.social || {};
      setSettings({
        ...raw,
        facebook: social.facebook || "",
        instagram: social.instagram || "",
        youtube: social.youtube || "",
        twitter: social.twitter || "",
      });
      setPages(cms.pages || []);
      setCategories(catalog.categories || []);
      const page =
        (cms.pages || []).find((p: Page) => p.key === activeKey) || cms.pages?.[0];
      if (page) {
        setActiveKey(page.key);
        setPageForm({ title: page.title, body: page.body });
      }
    });
  }

  useEffect(load, []);

  const parents = useMemo(
    () =>
      filterPublicCategories(
        categories.filter((c) => !c.parent).map((c) => ({ ...c }))
      ),
    [categories]
  );

  function set(key: string, value: string | number) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function saveSettings(e?: FormEvent) {
    e?.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/cms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          storeName: settings.storeName,
          tagline: settings.tagline,
          phone: settings.phone,
          email: settings.email,
          whatsapp: settings.whatsapp,
          address: settings.address,
          heroHeadline: settings.heroHeadline,
          heroSubheadline: settings.heroSubheadline,
          heroCtaLabel: settings.heroCtaLabel,
          heroCtaHref: settings.heroCtaHref,
          heroImage: settings.heroImage,
          homeCategoriesEyebrow: settings.homeCategoriesEyebrow,
          homeCategoriesTitle: settings.homeCategoriesTitle,
          homeBestsellersEyebrow: settings.homeBestsellersEyebrow,
          homeBestsellersTitle: settings.homeBestsellersTitle,
          homeBrandsEyebrow: settings.homeBrandsEyebrow,
          homeBrandsTitle: settings.homeBrandsTitle,
          homeBlogEyebrow: settings.homeBlogEyebrow,
          homeBlogTitle: settings.homeBlogTitle,
          freeShippingThreshold: Number(settings.freeShippingThreshold || 1000),
          shippingFee: Number(settings.shippingFee || 99),
          pickupLocationName: settings.pickupLocationName,
          social: {
            facebook: String(settings.facebook ?? ""),
            instagram: String(settings.instagram ?? ""),
            youtube: String(settings.youtube ?? ""),
            twitter: String(settings.twitter ?? ""),
          },
        },
      }),
    });
    if (res.ok) setMsg("Saved");
    load();
  }

  async function savePage(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/cms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: { key: activeKey, title: pageForm.title, body: pageForm.body },
      }),
    });
    if (res.ok) setMsg("Page saved");
    load();
  }

  async function saveCategoryName(id: string, name: string) {
    await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", id, data: { name: name.trim() } }),
    });
    setMsg("Category name saved");
    load();
  }

  async function saveCategoryImage(id: string, urls: string[]) {
    await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "category",
        id,
        data: { image: urls[0] || "" },
      }),
    });
    setMsg("Category photo saved");
    load();
  }

  const tabs = [
    { id: "store" as const, label: "1. Store info" },
    { id: "banner" as const, label: "2. Home banner" },
    { id: "home" as const, label: "3. Home section titles" },
    { id: "categories" as const, label: "4. Shop by category" },
    { id: "shipping" as const, label: "5. Shipping & social" },
    { id: "pages" as const, label: "6. Site pages" },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="display text-3xl sm:text-4xl">Site</h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        Update every text and photo shoppers see. Go section by section — then
        Save.
      </p>
      {msg && <p className="mt-3 text-sm text-[var(--success)]">{msg}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn btn-ghost btn-sm ${
              section === t.id ? "border-[var(--fg)] font-semibold" : ""
            }`}
            onClick={() => setSection(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === "store" && (
        <form onSubmit={saveSettings} className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="display text-2xl">Store info</h2>
          <Field
            id="storeName"
            label="Store name"
            value={String(settings.storeName ?? "")}
            onChange={(v) => set("storeName", v)}
          />
          <Field
            id="tagline"
            label="Tagline"
            value={String(settings.tagline ?? "")}
            onChange={(v) => set("tagline", v)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="phone"
              label="Phone"
              value={String(settings.phone ?? "")}
              onChange={(v) => set("phone", v)}
            />
            <Field
              id="email"
              label="Email"
              value={String(settings.email ?? "")}
              onChange={(v) => set("email", v)}
            />
          </div>
          <Field
            id="whatsapp"
            label="WhatsApp"
            value={String(settings.whatsapp ?? "")}
            onChange={(v) => set("whatsapp", v)}
          />
          <Field
            id="address"
            label="Address"
            value={String(settings.address ?? "")}
            onChange={(v) => set("address", v)}
          />
          <button className="btn btn-primary" type="submit">
            Save store info
          </button>
        </form>
      )}

      {section === "banner" && (
        <form onSubmit={saveSettings} className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="display text-2xl">Home banner</h2>
          <Field
            id="heroHeadline"
            label="Headline"
            value={String(settings.heroHeadline ?? "")}
            onChange={(v) => set("heroHeadline", v)}
          />
          <Field
            id="heroSubheadline"
            label="Short line under headline"
            value={String(settings.heroSubheadline ?? "")}
            onChange={(v) => set("heroSubheadline", v)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="heroCtaLabel"
              label="Button text"
              value={String(settings.heroCtaLabel ?? "")}
              onChange={(v) => set("heroCtaLabel", v)}
            />
            <Field
              id="heroCtaHref"
              label="Button link"
              value={String(settings.heroCtaHref ?? "")}
              onChange={(v) => set("heroCtaHref", v)}
              hint="Example: /collections/guitars"
            />
          </div>
          <div>
            <p className="field-label">Banner photo</p>
            <ImageDropzone
              values={settings.heroImage ? [String(settings.heroImage)] : []}
              onChange={(urls) => set("heroImage", urls[0] || "")}
              alt="Hero"
              label="Drop banner photo here"
              aspect={16 / 9}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Save banner
          </button>
        </form>
      )}

      {section === "home" && (
        <form onSubmit={saveSettings} className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="display text-2xl">Home section titles</h2>
          <p className="text-sm text-[var(--fg-muted)]">
            These are the headings above each block on the home page.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="homeCategoriesEyebrow"
              label="Categories — small label"
              value={String(settings.homeCategoriesEyebrow ?? "Explore")}
              onChange={(v) => set("homeCategoriesEyebrow", v)}
            />
            <Field
              id="homeCategoriesTitle"
              label="Categories — title"
              value={String(settings.homeCategoriesTitle ?? "Shop by category")}
              onChange={(v) => set("homeCategoriesTitle", v)}
            />
            <Field
              id="homeBestsellersEyebrow"
              label="Bestsellers — small label"
              value={String(settings.homeBestsellersEyebrow ?? "Curated")}
              onChange={(v) => set("homeBestsellersEyebrow", v)}
            />
            <Field
              id="homeBestsellersTitle"
              label="Bestsellers — title"
              value={String(settings.homeBestsellersTitle ?? "Bestsellers")}
              onChange={(v) => set("homeBestsellersTitle", v)}
            />
            <Field
              id="homeBrandsEyebrow"
              label="Brands — small label"
              value={String(settings.homeBrandsEyebrow ?? "Trusted names")}
              onChange={(v) => set("homeBrandsEyebrow", v)}
            />
            <Field
              id="homeBrandsTitle"
              label="Brands — title"
              value={String(settings.homeBrandsTitle ?? "Brands we stock")}
              onChange={(v) => set("homeBrandsTitle", v)}
            />
            <Field
              id="homeBlogEyebrow"
              label="Blog — small label"
              value={String(settings.homeBlogEyebrow ?? "Learn")}
              onChange={(v) => set("homeBlogEyebrow", v)}
            />
            <Field
              id="homeBlogTitle"
              label="Blog — title"
              value={String(settings.homeBlogTitle ?? "From the blog")}
              onChange={(v) => set("homeBlogTitle", v)}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Save section titles
          </button>
        </form>
      )}

      {section === "categories" && (
        <div className="mt-8 space-y-4">
          <h2 className="display text-2xl">Shop by category tiles</h2>
          <p className="text-sm text-[var(--fg-muted)]">
            Change the name and front photo for each tile. Software & Plugins is
            hidden from the shop.
          </p>
          <p className="text-sm">
            Full editor also at{" "}
            <Link href="/admin/shop-by-category" className="underline">
              Shop by category
            </Link>
            .
          </p>
          {parents.map((c) => (
            <article
              key={c._id}
              className="border border-[var(--line)] bg-[var(--bg-elevated)] p-4"
            >
              <label className="field-label" htmlFor={`cat-${c._id}`}>
                Name
              </label>
              <div className="mb-3 flex gap-2">
                <input
                  id={`cat-${c._id}`}
                  className="input"
                  defaultValue={c.name}
                  key={`${c._id}-${c.name}`}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm shrink-0"
                  onClick={() => {
                    const el = document.getElementById(
                      `cat-${c._id}`
                    ) as HTMLInputElement | null;
                    if (el) void saveCategoryName(c._id, el.value);
                  }}
                >
                  Save name
                </button>
              </div>
              <p className="field-label">Front photo</p>
              <ImageDropzone
                values={c.image ? [c.image] : []}
                onChange={(urls) => void saveCategoryImage(c._id, urls)}
                alt={c.name}
                label="Drop photo here"
                aspect={4 / 3}
              />
            </article>
          ))}
        </div>
      )}

      {section === "shipping" && (
        <form onSubmit={saveSettings} className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="display text-2xl">Shipping & social</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="freeShippingThreshold"
              label="Free shipping above (₹)"
              value={String(settings.freeShippingThreshold ?? 1000)}
              onChange={(v) => set("freeShippingThreshold", v)}
            />
            <Field
              id="shippingFee"
              label="Shipping fee (₹)"
              value={String(settings.shippingFee ?? 99)}
              onChange={(v) => set("shippingFee", v)}
            />
          </div>
          <Field
            id="instagram"
            label="Instagram URL"
            value={String(settings.instagram ?? "")}
            onChange={(v) => set("instagram", v)}
          />
          <Field
            id="facebook"
            label="Facebook URL"
            value={String(settings.facebook ?? "")}
            onChange={(v) => set("facebook", v)}
          />
          <Field
            id="youtube"
            label="YouTube URL"
            value={String(settings.youtube ?? "")}
            onChange={(v) => set("youtube", v)}
          />
          <button className="btn btn-primary" type="submit">
            Save shipping & social
          </button>
        </form>
      )}

      {section === "pages" && (
        <form onSubmit={savePage} className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="display text-2xl">Site pages</h2>
          <p className="text-sm text-[var(--fg-muted)]">
            About, FAQs, policies — pick a page, edit the text, save.
          </p>
          <label className="field-label" htmlFor="pageKey">
            Which page?
          </label>
          <select
            id="pageKey"
            className="input"
            value={activeKey}
            onChange={(e) => {
              const key = e.target.value;
              setActiveKey(key);
              const page = pages.find((p) => p.key === key);
              if (page) setPageForm({ title: page.title, body: page.body });
            }}
          >
            {pages.map((p) => (
              <option key={p.key} value={p.key}>
                {PAGE_LABELS[p.key] || p.key}
              </option>
            ))}
          </select>
          <Field
            id="pageTitle"
            label="Page title"
            value={pageForm.title}
            onChange={(v) => setPageForm({ ...pageForm, title: v })}
          />
          <div>
            <label className="field-label" htmlFor="pageBody">
              Page text
            </label>
            <textarea
              id="pageBody"
              className="input min-h-56"
              value={pageForm.body}
              onChange={(e) => setPageForm({ ...pageForm, body: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Save this page
          </button>
        </form>
      )}
    </div>
  );
}
