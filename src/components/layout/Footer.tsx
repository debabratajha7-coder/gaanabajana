import Link from "next/link";

type Settings = {
  storeName?: string;
  phone?: string;
  email?: string;
  tagline?: string;
  address?: string;
};

export function Footer({ settings }: { settings?: Settings }) {
  const phones = (settings?.phone || "")
    .split(/[,|·•]/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--bg-elevated)]">
      <div className="container-gb grid gap-10 py-12 sm:py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display text-3xl">{settings?.storeName || "Gaanbajna"}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--fg-muted)]">
            {settings?.tagline ||
              "Musical instruments & audio gear for every stage."}
          </p>
          <div className="mt-5 space-y-1 text-sm text-[var(--fg-muted)]">
            {phones.map((p) => (
              <p key={p}>
                <a href={`tel:${p.replace(/\s+/g, "")}`} className="hover:text-[var(--accent)]">
                  {p}
                </a>
              </p>
            ))}
            {settings?.address && (
              <p className="max-w-xs leading-relaxed">{settings.address}</p>
            )}
            {settings?.email && (
              <p>
                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-[var(--accent)]"
                >
                  {settings.email}
                </a>
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="eyebrow mb-4">Shop</p>
          <div className="grid gap-2.5 text-sm">
            <Link href="/collections/guitars" className="hover:text-[var(--accent)]">
              Guitars
            </Link>
            <Link
              href="/collections/keyboards-pianos"
              className="hover:text-[var(--accent)]"
            >
              Keyboards
            </Link>
            <Link
              href="/collections/drums-percussion"
              className="hover:text-[var(--accent)]"
            >
              Drums
            </Link>
            <Link href="/deals" className="hover:text-[var(--accent)]">
              Deals
            </Link>
          </div>
        </div>

        <div>
          <p className="eyebrow mb-4">Help</p>
          <div className="grid gap-2.5 text-sm">
            <Link href="/faqs" className="hover:text-[var(--accent)]">
              FAQs
            </Link>
            <Link href="/policies/shipping" className="hover:text-[var(--accent)]">
              Shipping
            </Link>
            <Link href="/policies/returns" className="hover:text-[var(--accent)]">
              Returns
            </Link>
            <Link href="/track-order" className="hover:text-[var(--accent)]">
              Track order
            </Link>
            <Link href="/contact" className="hover:text-[var(--accent)]">
              Contact
            </Link>
            <Link href="/about" className="hover:text-[var(--accent)]">
              About
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--line)] py-4 text-center text-[11px] tracking-wide text-[var(--fg-muted)]">
        © {new Date().getFullYear()} Gaanbajna
      </div>
    </footer>
  );
}
