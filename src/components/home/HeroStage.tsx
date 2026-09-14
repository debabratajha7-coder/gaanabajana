"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

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
    <section
      ref={ref}
      /* Narrow / editor preview: fixed stage height — not nearly full svh (that left a black void above the copy). Desktop keeps the tall cinematic hero. */
      className="relative h-[min(36rem,calc(100svh-8.5rem))] overflow-hidden md:h-auto md:min-h-[88vh]"
    >
      <motion.div className="absolute inset-0" style={{ y: imageY }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="animate-hero-zoom absolute inset-0 h-full max-h-none w-full max-w-none object-cover object-[center_48%] md:object-center"
        />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 bg-black/20 md:bg-black/25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10 md:from-black/70 md:via-black/25 md:to-transparent" />

      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative flex h-full flex-col justify-end px-[max(0.75rem,calc((100vw-1120px)/2))] pb-6 pt-16 md:min-h-[88vh] md:pb-16 md:pt-24"
      >
        <div className="w-full max-w-[min(100%,36rem)]">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease }}
            className="display text-[clamp(2.1rem,9vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]"
          >
            {storeName.toLowerCase()}
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease }}
            className="mt-3 max-w-xl text-[0.95rem] text-white/95 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)] sm:mt-5 sm:text-xl md:text-2xl"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease }}
            className="mt-2 max-w-md text-sm leading-relaxed text-white/80 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)] sm:mt-3 sm:text-base"
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.26, ease }}
            className="mt-5 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3"
          >
            <Link href={ctaHref} className="btn btn-primary">
              {ctaLabel}
            </Link>
            <Link
              href="/deals"
              className="btn btn-ghost border-white/30 text-white hover:border-white hover:text-white"
            >
              View deals
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
