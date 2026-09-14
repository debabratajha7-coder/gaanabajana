"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImageDropzone } from "@/components/admin/ImageDropzone";

type Settings = Record<string, string | number>;
type Page = { key: string; title: string; body: string };

const TEXT_KEYS = [
  "storeName",
  "tagline",
  "phone",
  "email",
  "whatsapp",
  "heroHeadline",
  "heroSubheadline",
  "heroCtaLabel",
  "heroCtaHref",
  "freeShippingThreshold",
  "shippingFee",
  "pickupLocationName",
] as const;

export default function AdminCmsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [pages, setPages] = useState<Page[]>([]);
  const [activeKey, setActiveKey] = useState("about");
  const [pageForm, setPageForm] = useState({ title: "", body: "" });
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || {});
        setPages(d.pages || []);
        const page = (d.pages || []).find((p: Page) => p.key === activeKey) || d.pages?.[0];
        if (page) {
          setActiveKey(page.key);
          setPageForm({ title: page.title, body: page.body });
        }
      });
  }

  useEffect(load, []);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
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
          heroHeadline: settings.heroHeadline,
          heroSubheadline: settings.heroSubheadline,
          heroCtaLabel: settings.heroCtaLabel,
          heroCtaHref: settings.heroCtaHref,
          heroImage: settings.heroImage,
          freeShippingThreshold: Number(settings.freeShippingThreshold || 1000),
          shippingFee: Number(settings.shippingFee || 99),
          pickupLocationName: settings.pickupLocationName,
        },
      }),
    });
    if (res.ok) setMsg("Settings saved");
    load();
  }

  async function savePage(e: FormEvent) {
    e.preventDefault();
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

  return (
    <div className="space-y-12">
      <div>
        <h1 className="display text-3xl">CMS / Texts</h1>
        {msg && <p className="mt-2 text-sm text-[var(--success)]">{msg}</p>}
      </div>

      <form onSubmit={saveSettings} className="grid gap-3 md:grid-cols-2">
        <h2 className="display text-2xl md:col-span-2">Site settings & hero</h2>
        {TEXT_KEYS.map((key) => (
          <div key={key}>
            <label className="field-label" htmlFor={key}>
              {key}
            </label>
            <input
              id={key}
              className="input"
              value={String(settings[key] ?? "")}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
            />
          </div>
        ))}
        <div className="md:col-span-2">
          <p className="field-label">Hero image</p>
          <ImageDropzone
            values={settings.heroImage ? [String(settings.heroImage)] : []}
            onChange={(urls) =>
              setSettings({ ...settings, heroImage: urls[0] || "" })
            }
            alt="Hero"
            label="Drop hero image here"
          />
        </div>
        <button className="btn btn-primary md:col-span-2" type="submit">
          Save settings
        </button>
      </form>

      <form onSubmit={savePage} className="space-y-3">
        <h2 className="display text-2xl">Page content</h2>
        <select
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
              {p.key}
            </option>
          ))}
        </select>
        <input
          className="input"
          value={pageForm.title}
          onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
        />
        <textarea
          className="input min-h-64 font-mono text-sm"
          value={pageForm.body}
          onChange={(e) => setPageForm({ ...pageForm, body: e.target.value })}
        />
        <button className="btn btn-primary" type="submit">
          Save page
        </button>
      </form>
    </div>
  );
}
