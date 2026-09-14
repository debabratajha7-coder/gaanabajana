"use client";

import { useEffect, useState } from "react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<
    {
      _id: string;
      rating: number;
      body: string;
      title?: string;
      approved: boolean;
      displayName?: string;
      authorName?: string;
      product?: { title?: string };
      user?: { name?: string; email?: string };
    }[]
  >([]);
  const [users, setUsers] = useState<
    { _id: string; name: string; email: string; phone?: string }[]
  >([]);
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/admin/reviews")
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        setUsers(d.users || []);
      });
  }

  useEffect(load, []);

  async function setApproved(reviewId: string, approved: boolean) {
    await fetch("/api/admin/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, approved }),
    });
    load();
  }

  async function remove(reviewId: string) {
    if (!confirm("Delete this comment?")) return;
    await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });
    load();
  }

  async function clearAll() {
    if (
      !confirm(
        "Remove ALL product comments and reset ratings? This cannot be undone."
      )
    ) {
      return;
    }
    const res = await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAll: true }),
    });
    if (res.ok) {
      setMsg("All comments cleared.");
      load();
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl">
              Reviews
            </h1>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Add comments while creating/editing a product. Manage them here
              too.
            </p>
          </div>
          <button type="button" className="btn btn-ghost text-sm" onClick={clearAll}>
            Clear all
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-[var(--success)]">{msg}</p>}
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li key={r._id} className="rounded-xl border border-[var(--line)] p-3 text-sm">
              <p className="font-medium">
                {r.product?.title} · ★ {r.rating}
              </p>
              <p className="text-[var(--fg-muted)]">
                {r.displayName || r.authorName || r.user?.name || "Customer"}
                {r.user?.email ? ` (${r.user.email})` : ""}
              </p>
              {r.title && <p className="mt-1 font-medium">{r.title}</p>}
              <p className="mt-2">{r.body}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setApproved(r._id, true)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setApproved(r._id, false)}
                >
                  Hide
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-[var(--danger)]"
                  onClick={() => remove(r._id)}
                >
                  Delete
                </button>
                <span className="self-center text-xs text-[var(--fg-muted)]">
                  {r.approved ? "Visible" : "Hidden"}
                </span>
              </div>
            </li>
          ))}
          {reviews.length === 0 && (
            <li className="text-[var(--fg-muted)]">No comments yet.</li>
          )}
        </ul>
      </div>
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl">
          Customers
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {users.map((u) => (
            <li key={u._id} className="border-b border-[var(--line)] py-2">
              {u.name} · {u.email} {u.phone ? `· ${u.phone}` : ""}
            </li>
          ))}
          {users.length === 0 && (
            <li className="text-[var(--fg-muted)]">No customer accounts yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
