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

  const imageY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 80]);
  const copyY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 40]);
  const copyOpacity = useTransform(
    scrollYProgress,
    [0, 0.55],
    reduce ? [1, 1] : [1, 0.35]
  );

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden md:min-h-[92vh]"
    >
      <motion.div className="absolute inset-0" style={{ y: imageY }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="animate-hero-zoom absolute inset-0 h-[115%] w-full object-cover object-center"
        />
      </motion.div>

      {/* Bottom-weighted vignette — instruments stay visible on the left */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_20%,transparent_20%,rgba(0,0,0,0.35)_70%,rgba(7,9,12,0.92)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/35 to-black/20" />

      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative flex min-h-[100svh] flex-col justify-end px-[max(0.75rem,calc((100vw-1120px)/2))] pb-28 pt-28 md:min-h-[92vh] md:justify-end md:pb-16"
      >
        <div className="max-w-[min(100%,42rem)]">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 28, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 0.85, ease }}
            className="display text-[clamp(3.25rem,12vw,8rem)] tracking-[-0.04em] text-white"
          >
            {storeName}
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease }}
            className="mt-5 max-w-xl text-lg text-white/95 sm:text-xl md:text-2xl"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.22, ease }}
            className="mt-3 max-w-md text-sm leading-relaxed text-white/70 sm:text-base"
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href={ctaHref} className="btn btn-primary">
              {ctaLabel}
            </Link>
            <Link href="/deals" className="btn btn-ghost border-white/25 text-white hover:border-white hover:text-white">
              View deals
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
