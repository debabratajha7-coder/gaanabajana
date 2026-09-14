"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { cn } from "@/lib/utils";

export function CartBadge({ count }: { count: number }) {
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (count <= 0) return;
    setPop(true);
    const t = window.setTimeout(() => setPop(false), 360);
    return () => window.clearTimeout(t);
  }, [count]);

  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[#1a120a]",
        pop && "animate-badge-pop"
      )}
    >
      {count}
    </span>
  );
}

export function useCartCount() {
  return useCart().count;
}
