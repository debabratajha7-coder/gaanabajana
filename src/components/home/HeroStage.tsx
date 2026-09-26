"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { brandWordmark } from "@/lib/brand";
import { AnnotatedPhrase } from "@/components/ui/annotate-phrase";
import { optimizedRemoteImage } from "@/lib/product-image";

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
  /** Mobile LCP: keep under ~640px; desktop hero capped for weight. */
  const mobileSrc = optimizedRemoteImage(image, { width: 720 });
  const desktopSrc = optimizedRemoteImage(image, { width: 1280 });

  const wordmark = brandWordmark(storeName);
  const [firstLine, ...restLines] = wordmark.split(" ");
  const secondLine = restLines.join(" ");

  const rating = ratingLabel ? (
    ratingHref ? (
      <a
        href={ratingHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium tracking-[0.18em] text-white/70 uppercase hover:text-white"
      >
        {ratingLabel}
      </a>
    ) : (
      <span className="text-xs font-medium tracking-[0.18em] text-white/70 uppercase">
        {ratingLabel}
      </span>
    )
  ) : null;

  return (
    <section
      ref={ref}
      data-hero-stage
      className="relative grid bg-[#070707] text-white md:h-[calc(100svh-16rem)] md:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1.35fr)] md:overflow-hidden"
    >
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="order-2 flex flex-col justify-between px-6 py-7 sm:px-8 md:order-1 md:px-9 md:py-9 lg:px-12 lg:py-10"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45 uppercase">
            Siliguri
          </p>
          {rating}
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mt-8 md:mt-0"
        >
          <p className="display max-w-full text-[clamp(3.1rem,8vw,5.6rem)] leading-[0.84] tracking-[-0.055em]">
            {firstLine}
          </p>
          {secondLine ? (
            <p
              className="display max-w-full text-[clamp(3.1rem,8vw,5.6rem)] leading-[0.84] tracking-[-0.055em] text-transparent"
              style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.9)" }}
            >
              {secondLine}
            </p>
          ) : null}

          <div className="mt-6 h-px w-16 bg-[#ff8a9a]" />

          <h1 className="mt-5 max-w-md text-lg leading-snug text-white md:text-2xl">
            <AnnotatedPhrase
              text={headline}
              phrase="your sound"
              variant="wavy"
              color="text-[#ff8a9a]"
              delay={0.45}
            />
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65 md:text-base">
            <AnnotatedPhrase
              text={subheadline}
              phrase="curated"
              variant="highlight"
              color="text-[#ff8a9a]"
              delay={0.6}
            />
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={ctaHref} className="btn btn-primary group rounded-full px-6">
              {ctaLabel}
              <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={visitHref}
              className="btn rounded-full border border-white/25 bg-transparent px-6 text-white hover:border-white hover:bg-white/10"
            >
              Visit store
            </Link>
          </div>
        </motion.div>
      </motion.div>

      <div className="relative order-1 h-[38vh] min-h-[13.5rem] md:order-2 md:h-auto md:min-h-0">
        <motion.div className="absolute inset-0" style={{ y: imageY }}>
          <Image
            src={mobileSrc}
            alt=""
            fill
            priority
            fetchPriority="high"
            quality={75}
            sizes="100vw"
            className="object-cover object-center md:hidden"
          />
          <Image
            src={desktopSrc}
            alt=""
            fill
            quality={75}
            sizes="58vw"
            className="hidden object-cover object-center md:block"
          />
        </motion.div>
      </div>
    </section>
  );
}
