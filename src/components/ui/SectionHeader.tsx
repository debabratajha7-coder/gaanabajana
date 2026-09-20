import Link from "next/link";
import { KineticTextReveal } from "@/components/ui/kinetic-text-reveal";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel = "View all",
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  centered?: boolean;
}) {
  if (centered) {
    return (
      <div className="mb-8 sm:mb-10">
        <div className="section-title-line">
          <h2 className="text-xl font-bold tracking-tight text-[var(--fg)] sm:text-2xl">
            <KineticTextReveal
              text={title}
              playOnView
              splitBy="words"
              direction="up"
              distance={18}
              stagger={0.06}
              className="justify-center text-xl font-bold tracking-tight text-[var(--fg)] sm:text-2xl"
            />
          </h2>
        </div>
        {subtitle ? (
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-[var(--fg-muted)] sm:text-[0.95rem]">
            {subtitle}
          </p>
        ) : null}
        {href && (
          <div className="mt-3 flex justify-end">
            <Link
              href={href}
              className="text-sm font-medium underline underline-offset-2 text-[var(--fg-muted)] hover:text-[var(--accent)]"
            >
              {linkLabel}
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="display text-2xl sm:text-3xl md:text-[2.35rem]">
          <KineticTextReveal
            text={title}
            playOnView
            splitBy="words"
            direction="up"
            distance={22}
            stagger={0.07}
            className="display text-2xl text-[var(--fg)] sm:text-3xl md:text-[2.35rem]"
          />
        </h2>
        {subtitle ? (
          <p className="mt-2 max-w-lg text-sm text-[var(--fg-muted)]">{subtitle}</p>
        ) : null}
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
