"use client";

import { useEffect, useState } from "react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<
    {
      _id: string;
      rating: number;
      body: string;
      approved: boolean;
      product?: { title?: string };
      user?: { name?: string; email?: string };
    }[]
  >([]);
  const [users, setUsers] = useState<
    { _id: string; name: string; email: string; phone?: string }[]
  >([]);

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

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Reviews</h1>
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li key={r._id} className="rounded-xl border border-[var(--line)] p-3 text-sm">
              <p className="font-medium">
                {r.product?.title} · ★ {r.rating}
              </p>
              <p className="text-[var(--fg-muted)]">
                {r.user?.name} ({r.user?.email})
              </p>
              <p className="mt-2">{r.body}</p>
              <div className="mt-2 flex gap-2">
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
                <span className="self-center text-xs text-[var(--fg-muted)]">
                  {r.approved ? "Visible" : "Hidden"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Customers</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {users.map((u) => (
            <li key={u._id} className="border-b border-[var(--line)] py-2">
              {u.name} · {u.email} {u.phone ? `· ${u.phone}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
