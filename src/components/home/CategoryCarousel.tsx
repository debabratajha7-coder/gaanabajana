"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categoryImage } from "@/lib/catalog-media";
import { themedProductImage } from "@/lib/product-image";
import { usePdpThemeOptional } from "@/components/product/PdpTheme";

type Cat = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
};

function CategoryImg({
  src,
  alt,
  fillHex,
}: {
  src: string;
  alt: string;
  fillHex: string;
}) {
  const [failed, setFailed] = useState(false);
  const themed = themedProductImage(src, fillHex);
  const finalSrc = failed ? src : themed;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={finalSrc}
      src={finalSrc}
      alt={alt}
      className="max-h-full max-w-full object-contain opacity-95 transition duration-500 group-hover:scale-[1.08] group-hover:opacity-100"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function CategoryCarousel({ categories }: { categories: Cat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = usePdpThemeOptional();
  /** Match page wash so cutouts sit on the section background */
  const fillHex = theme?.theme === "dark" ? "0A0A0A" : "F7F5F3";

  function scroll(dir: -1 | 1) {
    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  }

  if (!categories.length) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous categories"
        className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] shadow-sm md:flex"
        onClick={() => scroll(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Next categories"
        className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] shadow-sm md:flex"
        onClick={() => scroll(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div ref={ref} className="scroll-row gap-6 px-1 md:px-10">
        {categories.map((c) => (
          <Link
            key={String(c._id)}
            href={`/collections/${c.slug}`}
            className="group w-[140px] shrink-0 text-center sm:w-[168px]"
          >
            <div className="mx-auto flex h-[140px] w-full items-end justify-center sm:h-[160px]">
              <CategoryImg
                src={categoryImage(c.slug, c.image)}
                alt={c.name}
                fillHex={fillHex}
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-[var(--fg)] transition group-hover:text-[var(--accent)] group-hover:underline group-hover:underline-offset-4">
              {c.name}
            </p>
            {c.description ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--fg-muted)] sm:text-xs">
                {c.description}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
