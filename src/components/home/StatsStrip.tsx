export type StatItem = { value: string; label: string };

export function StatsStrip({ items }: { items: StatItem[] }) {
  const list = items.filter((i) => i.value?.trim() && i.label?.trim()).slice(0, 4);
  if (!list.length) return null;

  return (
    <section className="bg-[#111111] text-white">
      <div className="container-gb grid grid-cols-2 gap-6 py-10 md:grid-cols-4 md:gap-0 md:py-12">
        {list.map((s, i) => (
          <div
            key={`${s.value}-${s.label}`}
            className={`text-center ${
              i > 0 ? "md:border-l md:border-white/15" : ""
            }`}
          >
            <p className="display text-2xl sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/65">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
