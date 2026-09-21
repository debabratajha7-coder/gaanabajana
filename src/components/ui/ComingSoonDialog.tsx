"use client";

import Link from "next/link";
import { X } from "lucide-react";

type ComingSoonDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  categoryName?: string;
};

export function ComingSoonDialog({
  open,
  onClose,
  title = "Products coming soon",
  categoryName,
}: ComingSoonDialogProps) {
  if (!open) return null;

  const detail = categoryName
    ? `We’re stocking “${categoryName}” soon. Check back shortly — more instruments and accessories are on the way.`
    : "We’re stocking this section soon. Check back shortly — more instruments and accessories are on the way.";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
      onClick={onClose}
    >
      <div
        className="glass-panel-strong relative w-full max-w-md p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3 top-3 icon-btn h-9 w-9"
          aria-label="Close"
          onClick={onClose}
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
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
          <Link href="/" className="btn btn-ghost" onClick={onClose}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
