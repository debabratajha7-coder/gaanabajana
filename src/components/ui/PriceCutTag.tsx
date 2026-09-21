"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn, discountPercent, formatINR } from "@/lib/utils";

type Phase = "mrp" | "slash" | "sale";

export function PriceCutTag({
  price,
  mrp,
  className,
  layout = "chip",
}: {
  price: number;
  mrp: number;
  className?: string;
  /** chip = overlay badge; inline = PDP price row */
  layout?: "chip" | "inline";
}) {
  const reduce = useReducedMotion() ?? false;
  const hasDiscount = mrp > price && mrp > 0;
  const save = discountPercent(price, mrp);
  const ref = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>(() =>
    reduce || !hasDiscount ? "sale" : "mrp"
  );
  const [armed, setArmed] = useState(() => reduce || !hasDiscount);

  useEffect(() => {
    if (reduce || !hasDiscount) {
      setPhase("sale");
      setArmed(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setArmed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasDiscount, reduce]);

  useEffect(() => {
    if (!armed || reduce || !hasDiscount) return;
    if (phase !== "mrp") return;

    const t1 = window.setTimeout(() => setPhase("slash"), 400);
    return () => window.clearTimeout(t1);
  }, [armed, phase, hasDiscount, reduce]);

  useEffect(() => {
    if (!armed || reduce || !hasDiscount) return;
    if (phase !== "slash") return;

    const t2 = window.setTimeout(() => setPhase("sale"), 300);
    return () => window.clearTimeout(t2);
  }, [armed, phase, hasDiscount, reduce]);

  const saleLabel = formatINR(price);
  const mrpLabel = formatINR(mrp);
  const aria = hasDiscount ? `${saleLabel}, was ${mrpLabel}` : saleLabel;

  const showSale = !hasDiscount || phase === "sale";
  const showMrp = hasDiscount && (phase === "mrp" || phase === "slash" || phase === "sale");
  const isInline = layout === "inline";

  return (
    <span
      ref={ref}
      className={cn(
        isInline
          ? "inline-flex flex-wrap items-center gap-2.5"
          : "glass-chip pointer-events-none absolute bottom-1.5 right-1.5 z-10 !items-stretch !rounded-lg px-1.5 py-1 sm:bottom-3 sm:right-3 sm:!rounded-xl sm:px-3 sm:py-2",
        className
      )}
      aria-label={aria}
    >
      <span
        className={cn(
          "relative flex items-end gap-0.5",
          isInline
            ? "flex-row flex-wrap items-baseline gap-2.5"
            : "min-w-0 flex-row flex-wrap items-baseline justify-end gap-x-1 gap-y-0 sm:min-w-[4.5rem] sm:flex-col sm:items-end"
        )}
        aria-hidden
      >
        {showMrp ? (
          <span className="relative inline-flex items-center justify-end overflow-visible order-last sm:order-none">
            <span
              className={cn(
                "font-semibold tabular-nums text-[var(--fg-muted)] transition-opacity duration-300",
                isInline ? "text-base" : "text-[9px] sm:text-xs",
                phase === "sale" && "line-through opacity-65"
              )}
            >
              {mrpLabel}
            </span>
          </span>
        ) : null}

        <span
          className={cn(
            "font-semibold tabular-nums text-[var(--price)] transition-all duration-300",
            isInline
              ? "text-2xl sm:text-[1.75rem]"
              : "text-[11px] sm:text-[13px]",
            showSale
              ? "translate-y-0 opacity-100"
              : "pointer-events-none absolute translate-y-1.5 opacity-0"
          )}
        >
          {saleLabel}
        </span>

        {showSale && save > 0 ? (
          <span
            className={cn(
              "rounded font-bold uppercase tracking-wide text-white bg-[var(--accent)]",
              isInline
                ? "rounded-full px-2.5 py-0.5 text-xs font-semibold"
                : "px-1 py-px text-[8px] sm:text-[9px]"
            )}
          >
            {save}% {isInline ? "OFF" : "off"}
          </span>
        ) : null}
      </span>
    </span>
  );
}
