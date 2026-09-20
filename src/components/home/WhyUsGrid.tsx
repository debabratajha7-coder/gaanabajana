import { ScrollBasedVelocity } from "@/components/ui/scroll-based-velocity";
import { AnnotatedPhrase } from "@/components/ui/annotate-phrase";

export type WhyItem = { title: string; body: string };

export function WhyUsGrid({
  title,
  items,
}: {
  title: string;
  items: WhyItem[];
}) {
  const list = items.filter((i) => i.title?.trim()).slice(0, 8);
  if (!list.length) return null;

  const band = list.map((i) => i.title.trim()).join("   ·   ") + "   ·   ";

  return (
    <section className="overflow-hidden border-y border-[var(--line)]">
      <div className="container-gb section-gb pb-6 sm:pb-8">
        <div className="section-title-line mb-0">
          <h2 className="text-xl font-bold tracking-tight text-[var(--fg)] sm:text-2xl">
            <AnnotatedPhrase
              text={title}
              phrase="Gaana Bajana"
              variant="underline"
              color="text-[var(--accent)]"
              delay={0.35}
              className="text-xl font-bold tracking-tight text-[var(--fg)] sm:text-2xl"
            />
          </h2>
        </div>
      </div>

      <div className="why-us-velocity pb-10 pt-2 sm:pb-12">
        <ScrollBasedVelocity
          text={band}
          default_velocity={0.85}
          className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,4.5vw,3.25rem)] font-semibold tracking-[-0.03em]"
        />
      </div>
    </section>
  );
}
