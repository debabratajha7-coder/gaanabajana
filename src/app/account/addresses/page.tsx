"use client";

import { FormEvent, useEffect, useState } from "react";

type Address = {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: true,
  });

  function load() {
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((d) => setAddresses(d.addresses || []));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({
      label: "Home",
      fullName: "",
      phone: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false,
    });
    load();
  }

  async function remove(addressId: string) {
    await fetch("/api/account/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId }),
    });
    load();
  }

  async function setDefault(addressId: string) {
    await fetch("/api/account/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId, isDefault: true }),
    });
    load();
  }

  return (
    <div className="mesh-bg">
    <div className="container-gb grid gap-10 py-12 lg:grid-cols-2">
      <div>
        <h1 className="display text-4xl">Addresses</h1>
        <div className="mt-6 space-y-3">
          {addresses.map((a) => (
            <div
              key={a._id}
              className="glass-panel p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  {a.label} · {a.fullName}
                </p>
                {a.isDefault && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">
                {a.line1}, {a.city}, {a.state} {a.pincode}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!a.isDefault && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDefault(a._id)}
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-[var(--danger)]"
                  onClick={() => remove(a._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && (
            <p className="text-[var(--fg-muted)]">No addresses saved yet.</p>
          )}
        </div>
      </div>
      <form onSubmit={onSubmit} className="glass-panel space-y-3 p-5 sm:p-6">
        <h2 className="display text-2xl">Add address</h2>
        {(
          [
            ["label", "Label"],
            ["fullName", "Full name"],
            ["phone", "Phone"],
            ["line1", "Address line"],
            ["city", "City"],
            ["state", "State"],
            ["pincode", "Pincode"],
            ["country", "Country"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="field-label" htmlFor={key}>
              {label}
            </label>
            <input
              id={key}
              className="input"
              value={String(form[key])}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={key !== "label"}
            />
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          />
          Set as default address
        </label>
        <button className="btn btn-primary" type="submit">
          Save address
        </button>
      </form>
    </div>
    </div>
  );
}
