import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

type Review = {
  quote: string;
  source?: string;
};

export function ReviewsStrip({
  title = "What musicians say",
  ratingLabel,
  reviewsUrl,
  reviews,
}: {
  title?: string;
  ratingLabel?: string;
  reviewsUrl?: string;
  reviews: Review[];
}) {
  if (!reviews.length) return null;

  return (
    <section className="border-t border-[var(--line)] bg-white">
      <div className="container-gb section-gb">
        <Reveal>
          <SectionHeader title={title} centered />
        </Reveal>
        {(ratingLabel || reviewsUrl) && (
          <Reveal delay={0.04}>
            <p className="mt-2 text-center text-sm text-[var(--fg-muted)]">
              {ratingLabel ? <span className="font-medium text-[var(--fg)]">{ratingLabel}</span> : null}
              {ratingLabel && reviewsUrl ? " · " : null}
              {reviewsUrl ? (
                <a
                  href={reviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-[var(--accent)]"
                >
                  Google reviews
                </a>
              ) : null}
            </p>
          </Reveal>
        )}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {reviews.slice(0, 3).map((r, i) => (
            <Reveal key={i} delay={0.06 + i * 0.06}>
              <blockquote className="border border-[var(--line)] bg-[var(--bg-soft)] p-5 sm:p-6">
                <p className="text-sm leading-relaxed text-[var(--fg)] sm:text-[0.95rem]">
                  “{r.quote}”
                </p>
                <footer className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  {r.source || "Google Review"}
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
        {reviewsUrl ? (
          <Reveal delay={0.22}>
            <div className="mt-8 text-center">
              <Link
                href={reviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--accent)] underline underline-offset-2"
              >
                View Google reviews
              </Link>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
