"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

function firstPhone(phone: string) {
  const part = phone.split(",")[0]?.trim() || phone.trim();
  const digits = part.replace(/[^\d+]/g, "");
  return { display: part, tel: digits.startsWith("+") ? digits : digits };
}

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function VisitStoreBand({
  storeName,
  address,
  phone,
  hours,
}: {
  storeName: string;
  address?: string;
  phone?: string;
  hours?: string;
}) {
  if (!address && !phone) return null;

  const phoneInfo = phone ? firstPhone(phone) : null;

  return (
    <section className="border-t border-[var(--line)] bg-[var(--fg)] text-[var(--footer-fg)]">
      <div className="container-gb section-gb">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Visit our store
          </p>
          <h2 className="display mt-3 max-w-xl text-3xl text-white sm:text-4xl">
            Come play it. Feel it. Make it yours.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
            Visit {storeName} in Siliguri and explore instruments and gear in person.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {address ? (
            <Reveal delay={0.06}>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                    Address
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/85">{address}</p>
                </div>
              </div>
            </Reveal>
          ) : null}
          {phoneInfo ? (
            <Reveal delay={0.1}>
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                    Phone
                  </p>
                  <a
                    href={`tel:${phoneInfo.tel}`}
                    className="mt-1.5 block text-sm text-white/85 hover:text-white"
                  >
                    {phoneInfo.display}
                  </a>
                  {hours ? (
                    <p className="mt-1 text-xs text-white/50">{hours}</p>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ) : null}
        </div>

        <Reveal delay={0.16}>
          <div className="mt-8 flex flex-wrap gap-3">
            {phoneInfo ? (
              <a href={`tel:${phoneInfo.tel}`} className="btn btn-primary group">
                Call now
                <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>
            ) : null}
            {address ? (
              <a
                href={mapsUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-white/25 bg-transparent text-white hover:border-white hover:bg-white/10"
              >
                Get directions
              </a>
            ) : null}
            <Link
              href="/contact"
              className="btn border border-white/25 bg-transparent text-white hover:border-white hover:bg-white/10"
            >
              Contact
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
