import { BadgeCheck, HandCoins, MapPin, Truck } from "lucide-react";
import { formatINR } from "@/lib/utils";

export function TrustStrip({
  freeShippingThreshold,
  codEnabled,
}: {
  freeShippingThreshold: number;
  codEnabled: boolean;
}) {
  const items = [
    {
      icon: Truck,
      title: "Free shipping",
      body:
        freeShippingThreshold > 0
          ? `On orders over ${formatINR(freeShippingThreshold)}`
          : "On every order",
    },
    codEnabled
      ? { icon: HandCoins, title: "Cash on delivery", body: "Pay when it arrives" }
      : null,
    { icon: BadgeCheck, title: "100% genuine", body: "Authorised brands only" },
    { icon: MapPin, title: "Store in Siliguri", body: "Try before you buy" },
  ].filter((i) => i !== null);

  return (
    <ul className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-inset ring-white/10 sm:mt-12 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, body }) => (
        <li
          key={title}
          className="flex items-center gap-3 bg-[#070707] px-3.5 py-4 sm:px-5 sm:py-5"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff8a9a]/12 text-[#ff8a9a] ring-1 ring-inset ring-[#ff8a9a]/25">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold leading-tight text-white sm:text-sm">
              {title}
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-white/55 sm:text-xs">
              {body}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
