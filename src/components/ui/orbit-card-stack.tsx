"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import {
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface OrbitStackItem {
  name: string;
  role: string;
  description: string;
  accent?: string;
  initials?: string;
  stat?: string;
  image?: string;
}

interface OrbitCardStackProps {
  items?: OrbitStackItem[];
  className?: string;
  cardClassName?: string;
  defaultActiveIndex?: number;
  spread?: number;
  lift?: number;
  onActiveChange?: (item: OrbitStackItem, index: number) => void;
  /** Profile deck (default) or quote-first review cards */
  variant?: "profile" | "review";
  /** When set, ArrowUpRight opens this URL (review variant) */
  href?: string;
}

const defaultItems: OrbitStackItem[] = [
  {
    name: "Mira Vale",
    role: "Creative Lead",
    description:
      "Shapes visual systems with enough restraint to feel expensive and enough edge to be remembered.",
    accent: "#f8d66d",
    initials: "MV",
    stat: "Identity",
    image: "/images/orbit-card-stack/mira-vale.png",
  },
  {
    name: "Noor Kade",
    role: "Product Strategy",
    description:
      "Turns loose ideas into sharp product moves, crisp priorities, and launchable experiences.",
    accent: "#78dcca",
    initials: "NK",
    stat: "Roadmap",
    image: "/images/orbit-card-stack/noor-kade.png",
  },
  {
    name: "Ari Chen",
    role: "Founder",
    description:
      "Sets the taste bar, protects the details, and keeps the whole team pointed at the same high signal.",
    accent: "#f3f1ea",
    initials: "AC",
    stat: "Vision",
    image: "/images/orbit-card-stack/ari-chen.png",
  },
  {
    name: "Sana Holt",
    role: "Frontend Engineer",
    description:
      "Builds the motion, polish, and interface texture that make the product feel calm under pressure.",
    accent: "#b9a7ff",
    initials: "SH",
    stat: "Motion",
    image: "/images/orbit-card-stack/sana-holt.png",
  },
  {
    name: "Ezra Moon",
    role: "Operations",
    description:
      "Keeps the machine quiet, the handoffs clean, and the team moving without pointless friction.",
    accent: "#ff9d77",
    initials: "EM",
    stat: "Systems",
    image: "/images/orbit-card-stack/ezra-moon.png",
  },
];

function inRange(index: number, length: number) {
  return Math.min(Math.max(0, index), Math.max(0, length - 1));
}

function initialsFor(item: OrbitStackItem) {
  return (
    item.initials ??
    item.name
      .split(/\s+/)
      .map((part) => part.at(0))
      .join("")
      .slice(0, 2)
      .toUpperCase()
  );
}

function Portrait({ item }: { item: OrbitStackItem }) {
  const initials = initialsFor(item);
  const shared =
    "relative flex aspect-[1.36] w-full overflow-hidden rounded-[1.45rem] border border-black/[0.08] bg-black/[0.045]";

  if (item.image) {
    return (
      <div className={shared}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
        />
        <span className="absolute bottom-4 right-4 rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div
      className={shared}
      style={{ "--portrait-accent": item.accent ?? "#f3f1ea" } as CSSProperties}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,var(--portrait-accent),transparent_24%),radial-gradient(circle_at_85%_72%,rgba(255,255,255,0.5),transparent_28%)] opacity-45" />
      <div className="absolute inset-x-8 bottom-0 h-[72%] rounded-t-[999px] border-2 border-zinc-950 bg-[#f7f5ef]" />
      <div className="absolute left-1/2 top-[22%] size-24 -translate-x-1/2 rounded-[45%_55%_48%_52%] border-2 border-zinc-950 bg-[#f5f2eb]">
        <span className="absolute left-[27%] top-[34%] size-2 rounded-full bg-zinc-950" />
        <span className="absolute right-[27%] top-[34%] size-2 rounded-full bg-zinc-950" />
        <span className="absolute left-1/2 top-[52%] h-6 w-4 -translate-x-1/2 rounded-b-full border-b-2 border-zinc-950" />
        <span
          className="absolute -top-5 left-1/2 h-9 w-24 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-zinc-950"
          style={{ backgroundColor: item.accent ?? "#f3f1ea" }}
        />
      </div>
      <span className="absolute bottom-4 right-4 rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white">
        {initials}
      </span>
    </div>
  );
}

/** Review media — stippled portrait when image is set, else accent wash */
function QuoteMedia({ item }: { item: OrbitStackItem }) {
  const accent = item.accent ?? "#d4af37";

  if (item.image) {
    return (
      <div className="relative aspect-[1.65] w-full overflow-hidden rounded-[calc(var(--radius-glass)-2px)] border border-[#d4af37]/35 bg-[#eceae6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex aspect-[1.65] w-full items-end overflow-hidden rounded-[calc(var(--radius-glass)-2px)] border border-[#d4af37]/35 bg-[var(--bg-soft)]"
      style={
        {
          "--quote-accent": accent,
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 70% 60% at 12% 20%, color-mix(in oklab, var(--quote-accent) 35%, transparent), transparent 55%),
            radial-gradient(ellipse 55% 50% at 90% 80%, color-mix(in oklab, var(--quote-accent) 18%, transparent), transparent 50%)
          `,
        }}
      />
      <span
        className="relative select-none px-4 pb-2 font-[family-name:var(--font-display)] text-[3.5rem] leading-none text-[var(--fg)] opacity-[0.14]"
        aria-hidden
      >
        “
      </span>
    </div>
  );
}

export function OrbitCardStack({
  items = defaultItems,
  className,
  cardClassName,
  defaultActiveIndex = 2,
  spread = 168,
  lift = 34,
  onActiveChange,
  variant = "profile",
  href,
}: OrbitCardStackProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const isReview = variant === "review";
  const cards = items.length ? items : defaultItems;
  const restingIndex = inRange(defaultActiveIndex, cards.length);
  const [activeIndex, setActiveIndex] = useState(restingIndex);
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const midpoint = (cards.length - 1) / 2;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const spreadPx = narrow
    ? Math.min(spread, Math.max(44, Math.round(window.innerWidth * 0.12)))
    : spread;
  const openScale = narrow ? 0.9 : 0.985;
  const closedScale = narrow ? 0.94 : 0.97;
  const liftPx = narrow ? Math.min(lift, 22) : lift;

  const layouts = useMemo(
    () =>
      cards.map((_, index) => {
        const orbit = index - midpoint;
        const stack = index - restingIndex;
        const yMul = narrow ? 0.55 : 1;
        const rotMul = narrow ? 0.55 : 1;
        return {
          open: {
            x: orbit * spreadPx,
            y:
              (Math.abs(orbit) * 30 + Math.max(0, Math.abs(orbit) - 1) * 10) *
              yMul,
            rotation: orbit * 8.5 * rotMul,
          },
          closed: {
            x: stack * (narrow ? 6 : 10),
            y: Math.abs(stack) * (narrow ? 3 : 5),
            rotation: stack * 2.8 * rotMul,
          },
        };
      }),
    [cards, midpoint, restingIndex, spreadPx, narrow]
  );

  const activate = (index: number) => {
    const next = inRange(index, cards.length);
    setOpen(true);
    setActiveIndex(next);
    onActiveChange?.(cards[next]!, next);
  };
  const close = () => {
    setOpen(false);
    setActiveIndex(restingIndex);
  };
  const leaveFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  };

  function openHref(e?: MouseEvent) {
    if (!href) return;
    e?.stopPropagation();
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className={cn(
        "relative flex min-h-full w-full items-center justify-center overflow-visible px-2 py-4 sm:overflow-hidden sm:p-8",
        className
      )}
    >
      <div
        ref={stageRef}
        className={cn(
          "relative w-full max-w-[980px]",
          isReview ? "h-[360px] sm:h-[340px]" : "h-[470px]"
        )}
        onMouseLeave={close}
        onBlur={leaveFocus}
        role="list"
        aria-label={isReview ? "Review card stack" : "Profile card stack"}
      >
        {cards.map((item, index) => {
          const position = open ? layouts[index]!.open : layouts[index]!.closed;
          const active = index === activeIndex;
          const style: CSSProperties = {
            zIndex: active ? 80 : 50 - Math.abs(index - activeIndex),
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${
              position.y - (open && active ? liftPx : 0)
            }px)) rotate(${position.rotation}deg) scale(${
              open ? openScale : closedScale
            })`,
            transitionDuration: reduceMotion ? "0ms" : "380ms",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          };

          return (
            <article
              key={`${item.name}-${index}`}
              role="listitem"
              tabIndex={0}
              aria-current={active ? "true" : undefined}
              className={cn(
                "absolute left-1/2 top-1/2 origin-bottom cursor-pointer outline-none transition-[transform]",
                isReview
                  ? "orbit-review-card w-[min(68vw,15rem)] rounded-[var(--radius-glass)] border p-3 focus-visible:ring-2 focus-visible:ring-[#d4af37]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] sm:w-[min(72vw,16.5rem)]"
                  : "w-[min(78vw,21rem)] rounded-[1.9rem] border border-black/10 bg-[#e9e6df] p-4 text-[#141414] focus-visible:ring-2 focus-visible:ring-zinc-950/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                cardClassName
              )}
              style={style}
              onMouseEnter={() => activate(index)}
              onFocus={() => activate(index)}
              onClick={() => activate(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  const next = (index + 1) % cards.length;
                  activate(next);
                  stageRef.current
                    ?.querySelectorAll<HTMLElement>("[role=listitem]")
                    [next]?.focus();
                }
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const next = (index - 1 + cards.length) % cards.length;
                  activate(next);
                  stageRef.current
                    ?.querySelectorAll<HTMLElement>("[role=listitem]")
                    [next]?.focus();
                }
                if (event.key === "Enter" && isReview && href) {
                  event.preventDefault();
                  window.open(href, "_blank", "noopener,noreferrer");
                }
                if (event.key === "Escape") {
                  event.currentTarget.blur();
                  close();
                }
              }}
            >
              <div className="relative">
                {isReview ? (
                  <QuoteMedia item={item} />
                ) : (
                  <Portrait item={item} />
                )}
                {(!isReview || href) && (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={href ? "Open Google reviews" : undefined}
                    aria-hidden={!href}
                    className={cn(
                      "absolute right-2.5 top-2.5 grid place-items-center rounded-full shadow-lg transition",
                      isReview
                        ? "size-8 bg-gradient-to-br from-[#fff4c8] via-[#d4af37] to-[#8a6a28] text-[#1a1408] shadow-black/20 hover:brightness-110"
                        : "size-10 bg-zinc-950 text-white shadow-black/20"
                    )}
                    onClick={(e) => {
                      if (href) openHref(e);
                      else e.preventDefault();
                    }}
                  >
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>

              {isReview ? (
                <div className="px-1 pb-0.5 pt-3">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#a67c2d] dark:text-[#e8c56a]">
                    {item.role}
                  </p>
                  <p className="mt-2 text-[0.88rem] font-medium leading-[1.4] tracking-[-0.01em] text-[var(--fg)] sm:text-[0.92rem]">
                    “{item.description}”
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#d4af37]/35 pt-2.5">
                    <span className="text-xs font-semibold text-[var(--fg)]">
                      {item.name}
                    </span>
                    {item.stat ? (
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#b8860b]">
                        {item.stat}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="px-2 pb-2 pt-6">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {item.role}
                  </p>
                  <h3 className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] text-zinc-950">
                    {item.name}
                  </h3>
                  <p className="mt-4 max-w-[17rem] text-[0.98rem] font-medium leading-[1.42] tracking-[-0.01em] text-zinc-700">
                    {item.description}
                  </p>
                  <div className="mt-5 border-t border-black/10 pt-4 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    {item.stat ?? "Profile"}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
