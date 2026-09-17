import Link from "next/link";

export type BrandTile = {
  _id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

/** White tiles with strong black borders (Bajaao-style) */
export function BrandLogoGrid({ brands }: { brands: BrandTile[] }) {
  if (!brands.length) {
    return (
      <p className="text-center text-sm text-[var(--fg-muted)]">
        Add brands and upload logos in Admin → Brands.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0 border-2 border-black sm:grid-cols-3 md:grid-cols-4">
      {brands.map((b) => (
        <Link
          key={b._id}
          href={`/brands/${b.slug}`}
          className="flex aspect-[5/3] items-center justify-center border border-black bg-white px-4 transition hover:bg-neutral-50 sm:px-6"
          title={b.name}
          aria-label={b.name}
        >
          {b.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.logo}
              alt={b.name}
              className="max-h-[70%] max-w-[85%] object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-center text-sm font-semibold tracking-wide text-neutral-800">
              {b.name}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
