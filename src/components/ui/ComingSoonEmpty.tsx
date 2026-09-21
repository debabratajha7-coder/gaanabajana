"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";

type ComingSoonEmptyProps = {
  title?: string;
  categoryName?: string;
  /** Show a one-time modal when the page loads (empty catalog). */
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
      <ComingSoonDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        categoryName={categoryName}
      />

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
