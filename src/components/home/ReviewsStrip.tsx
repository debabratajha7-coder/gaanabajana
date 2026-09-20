"use client";

import { Reveal } from "@/components/ui/Reveal";
import { AnnotatedPhrase } from "@/components/ui/annotate-phrase";
import {
  OrbitCardStack,
  type OrbitStackItem,
} from "@/components/ui/orbit-card-stack";

type Review = {
  quote: string;
  source?: string;
};

const ACCENTS = ["#d4af37", "#c9a227", "#b8860b", "#e8c56a", "#a67c2d"];
const AVATARS = [
  "/reviews/review-avatar-01.png",
  "/reviews/review-avatar-02.png",
  "/reviews/review-avatar-03.png",
];

function compactRating(label?: string): string {
  if (!label) return "Review";
  const m = label.match(/[\d.]+/);
  return m ? `${m[0]} ★` : "Review";
}

function toOrbitItems(reviews: Review[], ratingLabel?: string): OrbitStackItem[] {
  return reviews.map((r, i) => {
    const source = (r.source || "Google review").replace(/\s+/g, " ").trim();
    const role = /google/i.test(source) ? "Google review" : source;
    return {
      name: "Verified buyer",
      role,
      description: r.quote,
      accent: ACCENTS[i % ACCENTS.length],
      stat: compactRating(ratingLabel),
      image: AVATARS[i % AVATARS.length],
    };
  });
}

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

  const items = toOrbitItems(reviews.slice(0, 5), ratingLabel);
  const mid = Math.min(1, Math.max(0, items.length - 1));
  const addYoursHref = reviewsUrl;

  return (
    <section className="border-t border-[var(--line)] bg-[var(--reviews-band)]">
      <div className="container-gb section-gb">
        <Reveal>
          <div className="mb-8 sm:mb-10">
            <div className="section-title-line">
              <h2 className="text-xl font-bold tracking-tight text-[var(--fg)] sm:text-2xl">
                <AnnotatedPhrase
                  text={title}
                  phrase="musicians"
                  variant="wavy"
                  color="text-[var(--accent)]"
                  delay={0.3}
                  className="text-xl font-bold tracking-tight text-[var(--fg)] sm:text-2xl"
                />
              </h2>
            </div>
          </div>
        </Reveal>
        {(ratingLabel || reviewsUrl) && (
          <Reveal delay={0.04}>
            <p className="-mt-4 mb-2 text-center text-sm text-[var(--fg-muted)] sm:-mt-5">
              {ratingLabel ? (
                <span className="font-medium text-[var(--fg)]">{ratingLabel}</span>
              ) : null}
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

        <Reveal delay={0.08}>
          <div className="relative">
            <OrbitCardStack
              variant="review"
              items={items}
              defaultActiveIndex={mid}
              spread={items.length <= 3 ? 108 : 96}
              lift={34}
              href={reviewsUrl || undefined}
              cardClassName="orbit-review-gold"
              className="min-h-[380px] overflow-visible p-1 sm:min-h-[360px] sm:p-2"
            />
          </div>
        </Reveal>

        {addYoursHref ? (
          <Reveal delay={0.14}>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:mt-4">
              <a
                href={addYoursHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary px-5 text-sm"
              >
                Add yours
              </a>
              <a
                href={addYoursHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--accent)] underline underline-offset-2"
              >
                View Google reviews
              </a>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
