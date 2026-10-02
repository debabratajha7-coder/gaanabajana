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
  const themed = themedProductImage(src, fillHex, {
    width: 480,
    bgRemoval: true,
  });
  const finalSrc = failed ? src : themed;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={finalSrc}
      src={finalSrc}
      alt={alt}
      className="max-h-full max-w-full object-contain transition duration-500 group-hover:scale-[1.06]"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function CategoryCarousel({ categories }: { categories: Cat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = usePdpThemeOptional();
  /** Must equal --bg-soft so cutouts blend into the tile well */
  const fillHex = theme?.theme === "dark" ? "1A1A1A" : "EFECE8";

  function scroll(dir: -1 | 1) {
    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  }

  if (!categories.length) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous categories"
        className="absolute left-0 top-[84px] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] shadow-sm md:flex"
        onClick={() => scroll(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Next categories"
        className="absolute right-0 top-[84px] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] shadow-sm md:flex"
        onClick={() => scroll(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div
        ref={ref}
        className="grid grid-cols-3 gap-x-2.5 gap-y-4 max-[359px]:grid-cols-2 sm:gap-x-4 md:flex md:snap-x md:snap-mandatory md:scroll-px-10 md:gap-6 md:overflow-x-auto md:px-10 md:pb-1.5 md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden"
      >
        {categories.map((c, i) => (
          <Link
            key={String(c._id)}
            href={`/collections/${c.slug}`}
            className={`group flex min-h-11 flex-col items-center rounded-2xl text-center transition-transform duration-150 active:scale-[0.97] md:w-[168px] md:shrink-0 md:snap-start ${
              i === categories.length - 1 && categories.length % 3 === 1
                ? "min-[360px]:max-md:col-start-2"
                : ""
            }`}
          >
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--bg-soft)] p-2.5 ring-1 ring-inset ring-[var(--line)] transition group-hover:ring-[color-mix(in_oklab,var(--accent)_45%,transparent)] sm:p-3.5 md:p-4">
              <CategoryImg
                src={categoryImage(c.slug, c.image)}
                alt={c.name}
                fillHex={fillHex}
              />
            </div>
            <p className="mt-2 line-clamp-2 px-0.5 text-[12.5px] font-semibold leading-tight text-[var(--fg)] transition group-hover:text-[var(--accent)] sm:text-sm md:mt-3">
              {c.name}
            </p>
            {c.description ? (
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--fg-muted)] max-md:hidden">
                {c.description}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
