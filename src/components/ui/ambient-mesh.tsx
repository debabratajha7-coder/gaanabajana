"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useEffect, useId, useMemo } from "react";
import { cn } from "@/lib/utils";

type AmbientMeshProps = {
  colors: string[];
  className?: string;
  tone?: "dark" | "light";
  /** When true, product color blooms in; false keeps a quiet base */
  active?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const WASHES = [
  {
    w: "78%",
    h: "58%",
    x: ["-12%", "6%", "-8%"],
    y: ["-18%", "4%", "-14%"],
    duration: 22,
    blur: 72,
    base: { dark: 0.55, light: 0.34 },
    delay: 0,
  },
  {
    w: "64%",
    h: "70%",
    x: ["48%", "62%", "42%"],
    y: ["-22%", "-4%", "-16%"],
    duration: 28,
    blur: 80,
    base: { dark: 0.42, light: 0.26 },
    delay: 0.12,
  },
  {
    w: "70%",
    h: "55%",
    x: ["-6%", "18%", "2%"],
    y: ["42%", "58%", "38%"],
    duration: 26,
    blur: 76,
    base: { dark: 0.48, light: 0.3 },
    delay: 0.22,
  },
  {
    w: "55%",
    h: "48%",
    x: ["52%", "38%", "58%"],
    y: ["48%", "62%", "44%"],
    duration: 20,
    blur: 64,
    base: { dark: 0.4, light: 0.24 },
    delay: 0.32,
  },
] as const;

const SPECKS = [
  {
    w: "28%",
    h: "22%",
    x: ["18%", "32%", "14%"],
    y: ["12%", "28%", "8%"],
    duration: 14,
    base: { dark: 0.35, light: 0.2 },
    delay: 0.4,
  },
  {
    w: "22%",
    h: "26%",
    x: ["62%", "48%", "68%"],
    y: ["55%", "42%", "60%"],
    duration: 16,
    base: { dark: 0.28, light: 0.16 },
    delay: 0.52,
  },
] as const;

/**
 * Product-tinted ambient field — glass Gen-Z storefront language,
 * with a soft staggered bloom when product colour arrives.
 */
export function AmbientMesh({
  colors,
  className,
  tone = "dark",
  active = true,
}: AmbientMeshProps) {
  const reduce = useReducedMotion();
  const reactId = useId();
  const isLight = tone === "light";

  const palette = useMemo(
    () => [
      colors[0] ?? "#1a3a6b",
      colors[1] ?? "#0d4f3c",
      colors[2] ?? "#1a1a3a",
      colors[3] ?? "#0a2040",
    ],
    [colors]
  );

  const paletteKey = palette.join("|");

  // 0 → 1 bloom when colour lands / changes
  const bloom = useMotionValue(reduce || !active ? 1 : 0);
  const washGain = useTransform(bloom, [0, 1], [0.08, 1]);
  const accentGain = useTransform(bloom, [0, 0.45, 1], [0.35, 0.75, 1]);
  const sat = useTransform(bloom, [0, 1], [0.55, isLight ? 1.05 : 1.2]);
  const fieldScale = useTransform(bloom, [0, 1], [0.94, 1]);
  const fieldFilter = useTransform(sat, (v) => `saturate(${v})`);

  useEffect(() => {
    if (reduce) {
      bloom.set(active ? 1 : 0);
      return;
    }
    bloom.set(0);
    const controls = animate(bloom, active ? 1 : 0, {
      duration: active ? 1.35 : 0.45,
      ease: EASE,
    });
    return () => controls.stop();
  }, [active, bloom, paletteKey, reduce]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ background: "var(--bg)" }}
      />

      {/* Brand + product corner cues — ease in with bloom */}
      <motion.div
        className="absolute inset-0"
        style={{ opacity: accentGain }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: isLight
              ? `
                radial-gradient(ellipse 70% 45% at 8% -5%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 55%),
                radial-gradient(ellipse 55% 40% at 96% 0%, color-mix(in oklab, ${palette[0]} 18%, transparent), transparent 50%),
                radial-gradient(ellipse 50% 45% at 50% 105%, color-mix(in oklab, var(--accent) 8%, transparent), transparent 55%)
              `
              : `
                radial-gradient(ellipse 70% 45% at 8% -5%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 55%),
                radial-gradient(ellipse 55% 40% at 96% 0%, color-mix(in oklab, ${palette[0]} 28%, transparent), transparent 50%),
                radial-gradient(ellipse 50% 45% at 50% 105%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 55%)
              `,
          }}
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 origin-center will-change-transform"
        style={{ scale: fieldScale, filter: fieldFilter }}
      >
        {WASHES.map((wash, i) => (
          <WashOrb
            key={`${reactId}-wash-${i}`}
            color={palette[i]!}
            wash={wash}
            tone={tone}
            isLight={isLight}
            reduce={!!reduce}
            gain={washGain}
            index={i}
          />
        ))}

        {SPECKS.map((speck, i) => (
          <SpeckOrb
            key={`${reactId}-speck-${i}`}
            color={palette[i]!}
            speck={speck}
            tone={tone}
            isLight={isLight}
            reduce={!!reduce}
            gain={washGain}
          />
        ))}
      </motion.div>

      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "linear-gradient(145deg, rgba(255,255,255,0.55) 0%, transparent 42%, transparent 58%, rgba(17,17,17,0.04) 100%)"
            : "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "radial-gradient(ellipse 68% 52% at 42% 32%, transparent 0%, color-mix(in oklab, var(--bg) 40%, transparent) 72%, color-mix(in oklab, var(--bg) 78%, transparent) 100%)"
            : "radial-gradient(ellipse 72% 55% at 42% 30%, transparent 0%, rgba(0,0,0,0.28) 70%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(20px) saturate(1.15)",
          WebkitBackdropFilter: "blur(20px) saturate(1.15)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          opacity: isLight ? 0.1 : 0.18,
          mixBlendMode: "overlay",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}

function WashOrb({
  color,
  wash,
  tone,
  isLight,
  reduce,
  gain,
  index,
}: {
  color: string;
  wash: (typeof WASHES)[number];
  tone: "dark" | "light";
  isLight: boolean;
  reduce: boolean;
  gain: MotionValue<number>;
  index: number;
}) {
  const opacity = useTransform(gain, (g) => wash.base[tone] * g);

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        width: wash.w,
        height: wash.h,
        left: 0,
        top: 0,
        borderRadius: "46% 54% 48% 52%",
        background: `radial-gradient(ellipse at 40% 45%, ${color} 0%, transparent 70%)`,
        opacity,
        filter: `blur(${wash.blur}px)`,
        mixBlendMode: isLight ? "multiply" : "soft-light",
        transition: "background 0.9s ease",
      }}
      initial={false}
      animate={
        reduce
          ? { x: wash.x[0], y: wash.y[0], scale: 1 }
          : {
              x: [...wash.x],
              y: [...wash.y],
              scale: [1, 1.06, 0.97, 1],
            }
      }
      transition={
        reduce
          ? { duration: 0 }
          : {
              duration: wash.duration,
              delay: wash.delay + index * 0.04,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }
      }
    />
  );
}

function SpeckOrb({
  color,
  speck,
  tone,
  isLight,
  reduce,
  gain,
}: {
  color: string;
  speck: (typeof SPECKS)[number];
  tone: "dark" | "light";
  isLight: boolean;
  reduce: boolean;
  gain: MotionValue<number>;
}) {
  const opacity = useTransform(gain, (g) => speck.base[tone] * g);

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        width: speck.w,
        height: speck.h,
        left: 0,
        top: 0,
        borderRadius: "50%",
        background: `radial-gradient(circle, color-mix(in oklab, ${color} 70%, white 30%) 0%, transparent 72%)`,
        opacity,
        filter: "blur(28px)",
        mixBlendMode: isLight ? "multiply" : "overlay",
        transition: "background 0.9s ease",
      }}
      initial={false}
      animate={
        reduce
          ? { x: speck.x[0], y: speck.y[0] }
          : { x: [...speck.x], y: [...speck.y] }
      }
      transition={
        reduce
          ? { duration: 0 }
          : {
              duration: speck.duration,
              delay: speck.delay,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }
      }
    />
  );
}
