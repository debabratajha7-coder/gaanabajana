"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

/** Jump to top on route change (instant — avoids footer→top scroll on phones). */
export function ScrollToTop() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
