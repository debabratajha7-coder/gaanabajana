"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useRef, type CSSProperties, type ReactNode, type PointerEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

type GalleryThumbsProps = {
  gallery: string[];
  activeImage: number;
  onSelect: (index: number) => void;
  renderImg: (src: string, className: string) => ReactNode;
};

export function GalleryThumbs({
  gallery,
  activeImage,
  onSelect,
  renderImg,
}: GalleryThumbsProps) {
  const reduce = useReducedMotion() ?? false;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollTarget = useMotionValue(0);
  const smoothScroll = useSpring(scrollTarget, {
    stiffness: 140,
    damping: 28,
    mass: 0.6,
  });

  useEffect(() => {
    if (reduce) return;
    return smoothScroll.on("change", (v) => {
      const el = scrollerRef.current;
      if (el) el.scrollTop = v;
    });
  }, [smoothScroll, reduce]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const btn = el.querySelector<HTMLElement>(`[data-thumb="${activeImage}"]`);
    if (!btn) return;
    const top =
      btn.offsetTop - el.clientHeight / 2 + btn.offsetHeight / 2;
    if (reduce) {
      el.scrollTop = Math.max(0, top);
    } else {
      scrollTarget.set(Math.max(0, Math.min(el.scrollHeight - el.clientHeight, top)));
    }
  }, [activeImage, reduce, scrollTarget]);

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    const rect = el.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    scrollTarget.set(t * max);
  }

  function scrollBy(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = dir * 88;
    const next = Math.max(
      0,
      Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + delta)
    );
    if (reduce) el.scrollTop = next;
    else scrollTarget.set(next);
  }

  const showChevrons = gallery.length > 4;

  return (
    <div className="flex flex-col items-center gap-2">
      {showChevrons && (
        <button
          type="button"
          aria-label="Previous images"
          onClick={() => scrollBy(-1)}
          className="flex h-8 w-8 items-center justify-center border transition"
          style={
            {
              borderColor: "var(--pdp-border)",
              color: "var(--pdp-muted)",
            } as CSSProperties
          }
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollerRef}
        onPointerMove={onPointerMove}
        className="flex max-h-[min(52vh,28rem)] flex-col gap-2 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {gallery.map((img, idx) => {
          const active = activeImage === idx;
          return (
            <motion.button
              key={`${img}-${idx}`}
              type="button"
              data-thumb={idx}
              onClick={() => onSelect(idx)}
              initial={reduce ? false : { opacity: 0, scale: 0.88, y: 10 }}
              animate={{
                opacity: active ? 1 : 0.62,
                scale: active ? 1.06 : 1,
                y: 0,
              }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      duration: 0.45,
                      delay: Math.min(idx * 0.045, 0.35),
                      ease: EASE,
                    }
              }
              whileHover={
                reduce
                  ? undefined
                  : { scale: active ? 1.08 : 1.03, opacity: 1 }
              }
              className="relative shrink-0 overflow-hidden border origin-center will-change-transform"
              style={{
                backgroundColor: "var(--pdp-panel)",
                borderColor: active ? "var(--pdp-fg)" : "var(--pdp-border)",
                boxShadow: active
                  ? "0 8px 24px color-mix(in oklab, var(--pdp-fg) 18%, transparent)"
                  : "none",
                zIndex: active ? 2 : 1,
              }}
            >
              {renderImg(
                img,
                "h-14 w-14 object-contain sm:h-[68px] sm:w-[68px] xl:h-[76px] xl:w-[76px]"
              )}
            </motion.button>
          );
        })}
      </div>

      {showChevrons && (
        <button
          type="button"
          aria-label="Next images"
          onClick={() => scrollBy(1)}
          className="flex h-8 w-8 items-center justify-center border transition"
          style={
            {
              borderColor: "var(--pdp-border)",
              color: "var(--pdp-muted)",
            } as CSSProperties
          }
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
