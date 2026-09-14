"use client";

import { FormEvent, useEffect, useState } from "react";

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<
    {
      _id: string;
      rating: number;
      body: string;
      approved: boolean;
      product?: { title?: string; slug?: string };
    }[]
  >([]);
  const [form, setForm] = useState({
    productId: "",
    rating: 5,
    title: "",
    body: "",
  });
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/account/reviews")
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/account/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg("Review submitted for approval");
    setForm({ productId: "", rating: 5, title: "", body: "" });
    load();
  }

  return (
    <div className="container-gb grid gap-10 py-12 lg:grid-cols-2">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl">My reviews</h1>
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-2xl border border-[var(--line)] p-4">
              <p className="font-medium">{r.product?.title}</p>
              <p className="text-sm text-[var(--accent)]">
                ★ {r.rating} · {r.approved ? "Approved" : "Pending"}
              </p>
              <p className="mt-2 text-[var(--fg-muted)]">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Write a review</h2>
        <input
          className="input"
          placeholder="Product ID (from product URL admin / API)"
          value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
          required
        />
        <input
          className="input"
          type="number"
          min={1}
          max={5}
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
        />
        <input
          className="input"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="input min-h-28"
          placeholder="Your review"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          required
        />
        {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
        <button className="btn btn-primary" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}
