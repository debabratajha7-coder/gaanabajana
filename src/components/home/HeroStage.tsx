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
      className="relative min-h-[100svh] overflow-hidden md:min-h-[88vh]"
    >
      <motion.div className="absolute inset-0" style={{ y: imageY }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="animate-hero-zoom absolute inset-0 h-[115%] w-full object-cover object-[center_30%] sm:object-center"
        />
      </motion.div>

      {/* Soft scrim only — keep the photo visible behind the type */}
      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative flex min-h-[100svh] flex-col justify-end px-[max(0.75rem,calc((100vw-1120px)/2))] pb-[calc(5.5rem+var(--safe-bottom))] pt-24 md:min-h-[88vh] md:pb-16"
      >
        <div className="w-full max-w-[min(100%,36rem)]">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease }}
            className="display text-[clamp(2.35rem,9.5vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]"
          >
            {storeName.toLowerCase()}
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease }}
            className="mt-4 max-w-xl text-base text-white/95 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)] sm:mt-5 sm:text-xl md:text-2xl"
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
            className="mt-6 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3"
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
