"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type PointerEvent,
} from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const LG_MQ = "(min-width: 1024px)";

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
  const [vertical, setVertical] = useState(false);
  const scrollTarget = useMotionValue(0);
  const smoothScroll = useSpring(scrollTarget, {
    stiffness: 140,
    damping: 28,
    mass: 0.6,
  });

  useEffect(() => {
    const mq = window.matchMedia(LG_MQ);
    const sync = () => setVertical(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduce || !vertical) return;
    return smoothScroll.on("change", (v) => {
      const el = scrollerRef.current;
      if (el) el.scrollTop = v;
    });
  }, [smoothScroll, reduce, vertical]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const btn = el.querySelector<HTMLElement>(`[data-thumb="${activeImage}"]`);
    if (!btn) return;

    if (vertical) {
      const top =
        btn.offsetTop - el.clientHeight / 2 + btn.offsetHeight / 2;
      const clamped = Math.max(
        0,
        Math.min(el.scrollHeight - el.clientHeight, top)
      );
      if (reduce) el.scrollTop = clamped;
      else scrollTarget.set(clamped);
    } else {
      const left =
        btn.offsetLeft - el.clientWidth / 2 + btn.offsetWidth / 2;
      el.scrollTo({
        left: Math.max(0, Math.min(el.scrollWidth - el.clientWidth, left)),
        behavior: reduce ? "auto" : "smooth",
      });
    }
  }, [activeImage, reduce, scrollTarget, vertical]);

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || !vertical) return;
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
    if (vertical) {
      const delta = dir * 88;
      const next = Math.max(
        0,
        Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + delta)
      );
      if (reduce) el.scrollTop = next;
      else scrollTarget.set(next);
    } else {
      el.scrollBy({ left: dir * 88, behavior: reduce ? "auto" : "smooth" });
    }
  }

  const showChevrons = gallery.length > 4;

  const chevronBtn =
    "hidden h-8 w-8 shrink-0 items-center justify-center border transition lg:flex";
  const chevronStyle = {
    borderColor: "var(--pdp-border)",
    color: "var(--pdp-muted)",
  } as CSSProperties;

  return (
    <div className="flex w-full flex-row items-center gap-2 lg:w-auto lg:flex-col">
      {showChevrons && (
        <button
          type="button"
          aria-label="Previous images"
          onClick={() => scrollBy(-1)}
          className={chevronBtn}
          style={chevronStyle}
        >
          <ChevronUp className="hidden h-4 w-4 lg:block" />
          <ChevronLeft className="h-4 w-4 lg:hidden" />
        </button>
      )}

      <div
        ref={scrollerRef}
        onPointerMove={onPointerMove}
        className="flex w-full flex-row gap-2 overflow-x-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:max-h-[min(52vh,28rem)] lg:w-auto lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto"
      >
        {gallery.map((img, idx) => {
          const active = activeImage === idx;
          return (
            <motion.button
              key={`${img}-${idx}`}
              type="button"
              data-thumb={idx}
              onClick={() => onSelect(idx)}
              initial={reduce ? false : { opacity: 0, scale: 0.88 }}
              animate={{
                opacity: active ? 1 : 0.62,
                scale: active ? 1.06 : 1,
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
          className={chevronBtn}
          style={chevronStyle}
        >
          <ChevronDown className="hidden h-4 w-4 lg:block" />
          <ChevronRight className="h-4 w-4 lg:hidden" />
        </button>
      )}
    </div>
  );
}
