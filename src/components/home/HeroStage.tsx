"use client";

import Link from "next/link";
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
};

export function HeroStage({
  image,
  storeName,
  headline,
  subheadline,
  ctaLabel,
  ctaHref,
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

  return (
    <section ref={ref} className="relative md:min-h-[88vh]">
      {/* Phone: image panel, then white copy band below. */}
      <div className="md:hidden">
        <div className="px-3 pt-3">
          <div className="overflow-hidden rounded-2xl bg-[var(--bg-elevated)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="block h-auto w-full" />
          </div>
        </div>

        <div className="bg-white px-5 pb-8 pt-6 text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease }}
            className="mx-auto flex max-w-[22rem] flex-col items-center"
          >
            <p
              className="display text-[clamp(2.15rem,10vw,3.1rem)] leading-[0.9] tracking-[-0.04em] text-[#111]"
              suppressHydrationWarning
            >
              {brandWordmark(storeName)}
            </p>

            <span
              aria-hidden
              className="mt-3 h-px w-16 bg-[var(--line-strong)]"
            />

            <h1 className="mt-3 text-[0.95rem] font-medium leading-snug text-[var(--fg)]">
              {headline}
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
              {subheadline}
            </p>

            <div className="mt-5 flex w-full flex-col gap-2.5">
              <Link href={ctaHref} className="btn btn-primary w-full justify-center rounded-full">
                {ctaLabel}
              </Link>
              <Link
                href="/deals"
                className="btn btn-ghost w-full justify-center rounded-full"
              >
                View deals
              </Link>
            </div>
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
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link href={ctaHref} className="btn btn-primary">
                {ctaLabel}
              </Link>
              <Link
                href="/deals"
                className="btn border border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10"
              >
                View deals
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
