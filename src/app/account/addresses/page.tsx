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

  return (
    <div className="container-gb grid gap-10 py-12 lg:grid-cols-2">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Addresses</h1>
        <div className="mt-6 space-y-3">
          {addresses.map((a) => (
            <div
              key={a._id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4"
            >
              <p className="font-medium">
                {a.label} · {a.fullName}
              </p>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">
                {a.line1}, {a.city}, {a.state} {a.pincode}
              </p>
              <button
                type="button"
                className="mt-2 text-sm text-[var(--danger)]"
                onClick={() => remove(a._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Add address</h2>
        {Object.entries(form).map(([key, value]) =>
          typeof value === "boolean" ? null : (
            <input
              key={key}
              className="input"
              placeholder={key}
              value={String(value)}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={key !== "label"}
            />
          )
        )}
        <button className="btn btn-primary" type="submit">
          Save address
        </button>
      </form>
    </div>
  );
}
