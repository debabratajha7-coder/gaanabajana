"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { brandWordmark } from "@/lib/brand";

type HeroStageProps = {
  image: string;
  storeName: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  visitHref?: string;
  ratingLabel?: string;
  ratingHref?: string;
};

export function HeroStage({
  image,
  storeName,
  headline,
  subheadline,
  ctaLabel,
  ctaHref,
  visitHref = "/stores",
  ratingLabel = "4.8+ ★ Google",
  ratingHref,
}: HeroStageProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 60]);
  const copyY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 28]);
  const copyOpacity = useTransform(
    scrollYProgress,
    [0, 0.55],
    reduce ? [1, 1] : [1, 0.4]
  );

  const ease = [0.22, 1, 0.36, 1] as const;

  const trustChip = ratingLabel ? (
    ratingHref ? (
      <a
        href={ratingHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/85 underline-offset-2 hover:underline"
      >
        {ratingLabel}
      </a>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/85">
        {ratingLabel}
      </span>
    )
  ) : null;

  const trustChipMobile = ratingLabel ? (
    ratingHref ? (
      <a
        href={ratingHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/80 underline-offset-2 hover:underline"
      >
        {ratingLabel}
      </a>
    ) : (
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/80">
        {ratingLabel}
      </span>
    )
  ) : null;

  return (
    <section ref={ref} className="relative md:min-h-[88vh]">
      {/* Phone: fuller-bleed image with overlay copy */}
      <div className="relative overflow-hidden md:hidden">
        <div className="relative min-h-[78vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease }}
            className="relative flex min-h-[78vh] flex-col justify-end px-5 pb-10 pt-24"
          >
            <p
              className="display text-[clamp(2.15rem,10vw,3.1rem)] leading-[0.9] tracking-[-0.04em] text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]"
              suppressHydrationWarning
            >
              {brandWordmark(storeName)}
            </p>

            <h1 className="mt-4 max-w-sm text-[0.95rem] font-medium leading-snug text-white/95">
              {headline}
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
              {subheadline}
            </p>

            <div className="mt-5 flex w-full flex-col gap-2.5">
              <Link
                href={ctaHref}
                className="btn btn-primary group w-full justify-center rounded-full"
              >
                {ctaLabel}
                <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={visitHref}
                className="btn w-full justify-center rounded-full border border-white/35 bg-transparent text-white hover:border-white hover:bg-white/10"
              >
                Visit store
              </Link>
            </div>
            {trustChipMobile}
          </motion.div>
        </div>
      </div>

      {/* Desktop: full-bleed cinematic cover with overlay copy */}
      <div className="relative hidden overflow-hidden md:block md:min-h-[88vh]">
        <motion.div className="absolute inset-0" style={{ y: imageY }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="animate-hero-zoom absolute inset-0 h-full w-full object-cover object-center"
          />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-black/25" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <motion.div
          style={{ y: copyY, opacity: copyOpacity }}
          className="relative flex min-h-[88vh] flex-col justify-end px-[max(0.75rem,calc((100vw-1120px)/2))] pb-16 pt-24"
        >
          <div className="w-full max-w-[min(100%,26rem)]">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease }}
              className="display text-[clamp(2.1rem,9vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]"
              suppressHydrationWarning
            >
              {brandWordmark(storeName)}
            </motion.p>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease }}
              className="mt-5 max-w-xl text-xl text-white/95 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)] md:text-2xl"
            >
              {headline}
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease }}
              className="mt-3 max-w-md text-base leading-relaxed text-white/80 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]"
            >
              {subheadline}
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.26, ease }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link href={ctaHref} className="btn btn-primary group">
                {ctaLabel}
                <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={visitHref}
                className="btn border border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10"
              >
                Visit store
              </Link>
            </motion.div>
            {trustChip && (
              <motion.div
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.36, ease }}
                className="mt-4"
              >
                {trustChip}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
