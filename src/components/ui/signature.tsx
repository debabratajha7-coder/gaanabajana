"use client";

import { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { parse as parseFont } from "opentype.js";
import { cn } from "@/lib/utils";

interface SignatureProps {
  /** Text to generate signature for */
  text?: string;
  /** Color of the signature path */
  color?: string;
  /** Font size of the signature */
  fontSize?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
  /** Only animate when in view */
  inView?: boolean;
  /** Only animate once */
  once?: boolean;
  /** Custom font URL to load */
  fontUrl?: string;
  /** Tighter crop + lighter stroke for nav/wordmarks */
  compact?: boolean;
  /** Periodic left→right gold shine (header wordmark) */
  shine?: boolean;
}

async function loadFont(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${url}`);
  const buffer = await res.arrayBuffer();
  return parseFont(buffer);
}

export function Signature({
  text = "Signature",
  color = "currentColor",
  fontSize = 32,
  duration = 1.5,
  delay = 0,
  className,
  inView = false,
  once = true,
  fontUrl,
  compact = false,
  shine = false,
}: SignatureProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [paths, setPaths] = useState<string[]>([]);
  const [width, setWidth] = useState<number>(300);
  const height = fontSize * (compact ? 2.15 : 3);
  const horizontalPadding = fontSize * (compact ? 0.06 : 0.1);
  const topMargin = fontSize * (compact ? 1.35 : 1.5);
  const baseline = topMargin;
  const strokeWidth = compact
    ? Math.max(1.15, fontSize * 0.055)
    : 2;
  const maskStroke = fontSize * (compact ? 0.16 : 0.22);
  const letterStagger = compact ? 0.12 : 0.2;
  const uid = useId().replace(/:/g, "");
  const maskId = `signature-reveal-${uid}`;
  const shineId = `signature-gold-${uid}`;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const fontPaths = fontUrl
          ? [fontUrl]
          : [
              "/LastoriaBoldRegular.otf",
              "https://www.componentry.fun/LastoriaBoldRegular.otf",
            ];

        let font = null;
        for (const path of fontPaths) {
          try {
            font = await loadFont(path);
            break;
          } catch {
            /* try next */
          }
        }

        if (!font) {
          throw new Error("Font could not be loaded from any path");
        }

        let x = horizontalPadding;
        const newPaths: string[] = [];

        for (const char of text) {
          const glyph = font.charToGlyph(char);
          const path = glyph.getPath(x, baseline, fontSize);
          newPaths.push(path.toPathData(3));

          const advanceWidth = glyph.advanceWidth ?? font.unitsPerEm;
          x += advanceWidth * (fontSize / font.unitsPerEm);
        }

        if (cancelled) return;
        setPaths(newPaths);
        setWidth(x + horizontalPadding);
      } catch (error) {
        console.error("Signature component font load error:", error);
        if (cancelled) return;
        setPaths([]);
        setWidth(text.length * fontSize * 0.6);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [text, fontSize, baseline, horizontalPadding, fontUrl]);

  const variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1 },
  };

  const shineActive = shine && !reduceMotion;
  const paint = shineActive ? `url(#${shineId})` : color;
  const sweep = Math.max(width * 0.45, 80);

  return (
    <motion.svg
      key={paths.length}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={cn(
        "overflow-visible text-foreground",
        compact && "opacity-[0.92]",
        shine && "signature-logo-shine",
        className
      )}
      initial="hidden"
      whileInView={inView ? "visible" : undefined}
      animate={inView ? undefined : "visible"}
      viewport={{ once }}
      role="img"
      aria-label={text}
    >
      <defs>
        {shineActive ? (
          <linearGradient
            id={shineId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={sweep}
            y2={0}
          >
            <stop offset="0%" stopColor="currentColor" />
            <stop offset="28%" stopColor="#b8860b" />
            <stop offset="42%" stopColor="#e8c56a" />
            <stop offset="50%" stopColor="#fff8dc" />
            <stop offset="58%" stopColor="#e8c56a" />
            <stop offset="72%" stopColor="#b8860b" />
            <stop offset="100%" stopColor="currentColor" />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              values={`${-sweep * 1.2} 0; ${width + sweep * 0.2} 0; ${width + sweep * 0.2} 0`}
              keyTimes="0; 0.28; 1"
              dur="7.5s"
              repeatCount="indefinite"
            />
          </linearGradient>
        ) : null}
        <mask id={maskId} maskUnits="userSpaceOnUse">
          {paths.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              stroke="white"
              strokeWidth={maskStroke}
              fill="none"
              variants={variants}
              transition={{
                pathLength: {
                  delay: delay + i * letterStagger,
                  duration,
                  ease: "easeInOut",
                },
                opacity: {
                  delay: delay + i * letterStagger + 0.01,
                  duration: 0.01,
                },
              }}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </mask>
      </defs>

      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke={paint}
          strokeWidth={strokeWidth}
          fill="none"
          variants={variants}
          transition={{
            pathLength: {
              delay: delay + i * letterStagger,
              duration,
              ease: "easeInOut",
            },
            opacity: {
              delay: delay + i * letterStagger + 0.01,
              duration: 0.01,
            },
          }}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      ))}

      <g mask={`url(#${maskId})`}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill={paint} />
        ))}
      </g>
    </motion.svg>
  );
}
