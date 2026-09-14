import Link from "next/link";

export function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="display text-2xl sm:text-3xl md:text-[2.35rem]">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-sm font-medium text-[var(--accent)] transition hover:opacity-80"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
