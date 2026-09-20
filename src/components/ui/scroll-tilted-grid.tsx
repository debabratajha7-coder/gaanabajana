"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "motion/react";
import ReactLenis from "lenis/react";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PriceCutTag } from "@/components/ui/PriceCutTag";

export interface ScrollTiltedGridImage {
  src: string;
  alt: string;
  href?: string;
  /** Plain caption (photo variant overlay) */
  caption?: string;
  /** Stage variant: glass chip title */
  title?: string;
  /** Stage variant: selling price (for PriceCutTag) */
  priceValue?: number;
  /** Stage variant: MRP (for PriceCutTag slash) */
  mrp?: number;
}

export interface ScrollTiltedGridProps {
  images: readonly ScrollTiltedGridImage[];
  loop?: boolean;
  initialCycles?: number;
  maxCycles?: number;
  smoothScroll?: boolean;
  aspectRatio?: string;
  perspective?: number;
  maxTilt?: number;
  maxBlur?: number;
  rounded?: string;
  sectionPadding?: string;
  className?: string;
  /** photo = framed cover tiles; stage = floating cutouts + glass captions */
  variant?: "photo" | "stage";
}

type TileVariables = CSSProperties & {
  "--tile-blur": string;
  "--tile-brightness": number;
  "--tile-saturation": number;
  "--tile-transform": string;
  "--tile-image-scale": number;
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function GalleryTile({
  image,
  index,
  aspectRatio,
  perspective,
  maxTilt,
  maxBlur,
  rounded,
  reduceMotion,
  variant,
}: {
  image: ScrollTiltedGridImage;
  index: number;
  aspectRatio: string;
  perspective: number;
  maxTilt: number;
  maxBlur: number;
  rounded: string;
  reduceMotion: boolean;
  variant: "photo" | "stage";
}) {
  const tileRef = useRef<HTMLElement>(null);
  const side = index % 2 === 0 ? -1 : 1;
  const isStage = variant === "stage";
  const tiltOn = !reduceMotion;

  useEffect(() => {
    const tile = tileRef.current;
    if (!tile || !tiltOn) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = tile.getBoundingClientRect();
      const travel = window.innerHeight + rect.height;
      const position = clamp((window.innerHeight - rect.top) / travel);
      const distance = Math.abs(position - 0.5) * 2;
      const signed = (position - 0.5) * 2;
      const eased = distance * distance * (3 - 2 * distance);
      // Soften tilt/skew on phones so the rack stays readable
      const phone = window.matchMedia("(max-width: 639px)").matches;
      const stageMul = phone ? 0.35 : 1;
      const x = side * eased * (isStage ? 12 * stageMul : 18);
      const y = -signed * eased * (isStage ? 16 * stageMul : 24);
      const tilt =
        -signed * (isStage ? maxTilt * (phone ? 0.25 : 0.7) : maxTilt);
      const roll = side * signed * (isStage ? (phone ? 0.6 : 2) : 3);
      const skew = -side * signed * (isStage ? (phone ? 1.2 : 4) : 7);

      tile.style.setProperty(
        "--tile-blur",
        `${eased * (phone && isStage ? Math.min(maxBlur, 1.5) : maxBlur)}px`
      );
      tile.style.setProperty(
        "--tile-brightness",
        String(1 - eased * (phone && isStage ? 0.12 : 0.35))
      );
      tile.style.setProperty(
        "--tile-saturation",
        String(1 - eased * (phone && isStage ? 0.12 : 0.35))
      );
      tile.style.setProperty(
        "--tile-image-scale",
        String(isStage ? 1 + eased * 0.06 : 1.03 + eased * 0.15)
      );
      tile.style.setProperty(
        "--tile-transform",
        `translate3d(${x}%, ${y}%, ${eased * (isStage ? (phone ? 24 : 100) : 180)}px) rotateX(${tilt}deg) rotateZ(${roll}deg) skewX(${skew}deg)`
      );
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(tile);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isStage, maxBlur, maxTilt, side, tiltOn]);

  const variables: TileVariables = {
    aspectRatio: isStage ? undefined : aspectRatio,
    borderRadius: rounded,
    perspective,
    "--tile-blur": "0px",
    "--tile-brightness": 1,
    "--tile-saturation": 1,
    "--tile-transform": "translate3d(0, 0, 0)",
    "--tile-image-scale": isStage ? 1 : 1.03,
  };

  const media = isStage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      alt={image.alt}
      className={cn(
        "mx-auto h-full max-h-[190px] w-auto max-w-full object-contain sm:max-h-[280px] md:max-h-[340px]",
        tiltOn && "[transform:scale(var(--tile-image-scale))]"
      )}
      loading={index < 4 ? "eager" : "lazy"}
      draggable={false}
    />
  ) : (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        className={cn(
          "h-full w-full object-cover",
          tiltOn && "[transform:scale(var(--tile-image-scale))]"
        )}
        loading={index < 4 ? "eager" : "lazy"}
        draggable={false}
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/55" />
      {image.caption ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <span className="line-clamp-2 text-left text-[11px] font-medium leading-snug text-white sm:text-sm">
            {image.caption}
          </span>
        </span>
      ) : null}
    </>
  );

  const frame = (
    <div
      className={cn(
        "relative w-full",
        isStage
          ? "flex items-end justify-center bg-transparent"
          : "overflow-hidden border border-black/10 bg-neutral-200 shadow-[0_24px_80px_rgba(20,18,14,0.16)] dark:border-white/10 dark:bg-neutral-900 dark:shadow-[0_24px_90px_rgba(0,0,0,0.45)]",
        tiltOn &&
          "[filter:blur(var(--tile-blur))_brightness(var(--tile-brightness))_saturate(var(--tile-saturation))] [transform:var(--tile-transform)] [transform-style:preserve-3d]"
      )}
      style={
        isStage
          ? { minHeight: "9.5rem", borderRadius: rounded }
          : { aspectRatio, borderRadius: rounded }
      }
    >
      {media}
      {isStage && typeof image.priceValue === "number" ? (
        <PriceCutTag price={image.priceValue} mrp={image.mrp ?? image.priceValue} />
      ) : null}
    </div>
  );

  const chip =
    isStage && image.title ? (
      <figcaption className="mt-2 flex justify-center px-0.5 sm:mt-3 sm:px-1">
        <span className="glass-chip max-w-full !rounded-lg px-2.5 py-1.5 text-left sm:!rounded-xl sm:px-3.5 sm:py-2">
          <span className="line-clamp-2 text-[10px] font-semibold leading-snug text-[var(--fg)] sm:line-clamp-1 sm:text-xs">
            {image.title}
          </span>
        </span>
      </figcaption>
    ) : null;

  const body = (
    <>
      {frame}
      {chip}
    </>
  );

  return (
    <figure
      ref={tileRef}
      className={cn("m-0", side > 0 && !reduceMotion && "pt-5 sm:pt-14 md:pt-20")}
      style={variables}
    >
      {image.href ? (
        <Link href={image.href} className="block" aria-label={image.alt}>
          {body}
        </Link>
      ) : (
        body
      )}
    </figure>
  );
}

/** Static 2-col cutout shelf when motion is reduced */
function StageStaticGrid({
  images,
}: {
  images: readonly ScrollTiltedGridImage[];
}) {
  return (
    <div className="mx-auto grid w-full max-w-[720px] grid-cols-2 gap-x-3 gap-y-7 px-1.5 sm:gap-x-8 sm:gap-y-10 sm:px-2">
      {images.map((image) => (
        <Link
          key={`${image.href}-${image.src}`}
          href={image.href || "#"}
          className="group flex flex-col items-center text-center"
          aria-label={image.alt}
        >
          <div className="relative flex w-full items-end justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              className="max-h-[190px] w-auto max-w-full object-contain transition duration-300 group-hover:scale-[1.04] sm:max-h-[280px]"
              loading="lazy"
            />
            {typeof image.priceValue === "number" ? (
              <PriceCutTag
                price={image.priceValue}
                mrp={image.mrp ?? image.priceValue}
              />
            ) : null}
          </div>
          {image.title ? (
            <span className="glass-chip mt-2 max-w-full !rounded-lg px-2.5 py-1.5 text-left sm:mt-3 sm:!rounded-xl sm:px-3 sm:py-2">
              <span className="line-clamp-2 text-[10px] font-semibold leading-snug text-[var(--fg)] sm:line-clamp-1 sm:text-xs">
                {image.title}
              </span>
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function ScrollTiltedGrid({
  images,
  loop = false,
  initialCycles = 2,
  maxCycles = 4,
  smoothScroll = true,
  aspectRatio = "4 / 5",
  perspective = 1000,
  maxTilt = 62,
  maxBlur = 7,
  rounded = "0.25rem",
  sectionPadding = "18vh",
  className,
  variant = "photo",
}: ScrollTiltedGridProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const isStage = variant === "stage";
  const cycleLimit = Math.max(1, maxCycles);
  const [cycleCount, setCycleCount] = useState(() =>
    clamp(initialCycles, 1, cycleLimit)
  );
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = loadMoreRef.current;
    if (!loop || !marker) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setCycleCount((count) => Math.min(cycleLimit, count + 1));
        }
      },
      { rootMargin: "1200px 0px" }
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [cycleLimit, loop]);

  const tiles = useMemo(
    () =>
      Array.from({ length: loop ? cycleCount : 1 }, (_, cycle) =>
        images.map((image, index) => ({ cycle, image, index }))
      ).flat(),
    [cycleCount, images, loop]
  );

  if (isStage && reduceMotion) {
    return (
      <section
        className={cn("relative w-full py-6", className)}
        aria-label="Bestsellers"
      >
        <StageStaticGrid images={images} />
      </section>
    );
  }

  const gallery = (
    <section
      className={cn("relative w-full overflow-hidden", className)}
      aria-label={isStage ? "Bestsellers stage rack" : "Scroll-reactive image gallery"}
    >
      <div
        className={cn(
          "mx-auto grid w-full grid-cols-2 items-start",
          isStage
            ? "max-w-[720px] gap-x-3 gap-y-7 px-1.5 sm:gap-x-8 sm:gap-y-16 sm:px-4"
            : "max-w-5xl gap-x-4 gap-y-16 px-4 sm:gap-x-10 sm:gap-y-28 sm:px-10 lg:gap-x-16"
        )}
        style={{ paddingBlock: sectionPadding }}
      >
        {tiles.map(({ cycle, image, index }) => (
          <GalleryTile
            key={`${cycle}-${index}-${image.src}-${image.href || ""}`}
            image={image}
            index={index}
            aspectRatio={aspectRatio}
            perspective={perspective}
            maxTilt={maxTilt}
            maxBlur={isStage ? Math.min(maxBlur, 4) : maxBlur}
            rounded={rounded}
            reduceMotion={reduceMotion}
            variant={variant}
          />
        ))}
      </div>
      {loop && cycleCount < cycleLimit ? (
        <div ref={loadMoreRef} className="h-px" aria-hidden />
      ) : null}
    </section>
  );

  return smoothScroll && !reduceMotion ? (
    <ReactLenis
      root
      options={{ autoRaf: true, lerp: 0.075, wheelMultiplier: 0.85 }}
    >
      {gallery}
    </ReactLenis>
  ) : (
    gallery
  );
}
