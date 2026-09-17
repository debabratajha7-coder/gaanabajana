import { ShieldCheck } from "lucide-react";

export type WhyItem = { title: string; body: string };

export function WhyUsGrid({
  title,
  items,
}: {
  title: string;
  items: WhyItem[];
}) {
  const list = items.filter((i) => i.title?.trim()).slice(0, 5);
  if (!list.length) return null;

  return (
    <section className="border-y border-[var(--line)] bg-white">
      <div className="container-gb section-gb">
        <div className="section-title-line mb-8 sm:mb-10">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {list.map((item) => (
            <div
              key={item.title}
              className="border border-[var(--line)] bg-white p-4 text-center"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1d4ed8]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[var(--fg)]">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--fg-muted)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
