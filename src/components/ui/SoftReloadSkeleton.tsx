"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CollectionSkeleton,
  ProductGridSkeleton,
  ProductPageSkeleton,
  Skeleton,
} from "@/components/ui/Skeleton";

/**
 * Instant skeleton while a rare catalog miss recovers.
 * No "Try again" copy — one quiet refresh, then stay on the skeleton
 * until the user navigates (server already retries before we get here).
 */
export function SoftReloadSkeleton({
  variant = "collection",
  storageKey,
}: {
  variant?: "collection" | "product" | "grid";
  storageKey: string;
}) {
  const router = useRouter();
  const key = `gb-soft-reload:${storageKey}`;
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    let already = false;
    try {
      already = sessionStorage.getItem(key) === "1";
    } catch {
      /* ignore */
    }
    if (already) return;
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => router.refresh(), 1200);
    return () => window.clearTimeout(t);
  }, [key, router]);

  if (variant === "product") return <ProductPageSkeleton />;
  if (variant === "grid") {
    return (
      <div className="container-gb py-12">
        <Skeleton className="h-9 w-40" />
        <div className="mt-8">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }
  return <CollectionSkeleton />;
}

export function ClearSoftReload({ storageKey }: { storageKey: string }) {
  useEffect(() => {
    try {
      sessionStorage.removeItem(`gb-soft-reload:${storageKey}`);
    } catch {
      /* ignore */
    }
  }, [storageKey]);
  return null;
}
