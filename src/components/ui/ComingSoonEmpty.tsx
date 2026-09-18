"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

type ComingSoonEmptyProps = {
  title?: string;
  categoryName?: string;
  /** Show a one-time modal when the page loads (PhonePe / empty catalog). */
  showPopup?: boolean;
};

export function ComingSoonEmpty({
  title = "Products coming soon",
  categoryName,
  showPopup = true,
}: ComingSoonEmptyProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!showPopup) return;
    setOpen(true);
  }, [showPopup]);

  const detail = categoryName
    ? `We’re stocking “${categoryName}” soon. Check back shortly — more instruments and accessories are on the way.`
    : "We’re stocking this section soon. Check back shortly — more instruments and accessories are on the way.";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coming-soon-title"
        >
          <div className="relative w-full max-w-md border border-[var(--line)] bg-white p-6 text-center shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 icon-btn h-9 w-9"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <p className="eyebrow text-[var(--accent)]">Coming soon</p>
            <h2
              id="coming-soon-title"
              className="display mt-2 text-2xl text-[var(--fg)] sm:text-3xl"
            >
              {title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
              {detail}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setOpen(false)}
              >
                Got it
              </button>
              <Link href="/" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto mt-10 max-w-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-6 py-10 text-center">
        <p className="eyebrow text-[var(--accent)]">Coming soon</p>
        <h2 className="display mt-2 text-2xl sm:text-3xl">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
          {detail}
        </p>
        <Link href="/" className="btn btn-primary mt-6 inline-flex">
          Browse other categories
        </Link>
      </div>
    </>
  );
}
