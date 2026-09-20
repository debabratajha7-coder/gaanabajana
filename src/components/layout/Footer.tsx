import Link from "next/link";
import { STORE_NAME, TRADE_NAME } from "@/lib/brand";

type Settings = {
  storeName?: string;
  phone?: string;
  email?: string;
  tagline?: string;
  address?: string;
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.35" cy="6.65" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6l.4-3H14V9z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const socialLinkClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--footer-muted)_35%,transparent)] text-[var(--footer-muted)] transition hover:border-[var(--footer-fg)] hover:text-[var(--footer-fg)]";

export function Footer({ settings }: { settings?: Settings }) {
  const phones = (settings?.phone || "")
    .split(/[,|·•]/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <footer className="site-footer mt-auto border-t border-[var(--line)]">
      <div className="container-gb grid gap-10 py-12 sm:py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display text-3xl" suppressHydrationWarning>
            {settings?.storeName || STORE_NAME}
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--footer-fg)]">
            {TRADE_NAME}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--fg-muted)]">
            {settings?.tagline ||
              "Musical instruments & audio gear for every stage."}
          </p>
          <div className="mt-4 flex items-center gap-2.5">
            <a href="#" aria-label="Instagram" className={socialLinkClass}>
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Facebook" className={socialLinkClass}>
              <FacebookIcon className="h-4 w-4" />
            </a>
            <a href="#" aria-label="WhatsApp" className={socialLinkClass}>
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>
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
            <Link href="/contact" className="hover:text-[var(--accent)]">
              Contact Us
            </Link>
            <Link href="/policies/shipping" className="hover:text-[var(--accent)]">
              Shipping Policy
            </Link>
            <Link href="/policies/returns" className="hover:text-[var(--accent)]">
              Refund & Cancellation
            </Link>
            <Link href="/policies/privacy" className="hover:text-[var(--accent)]">
              Privacy Policy
            </Link>
            <Link href="/policies/terms" className="hover:text-[var(--accent)]">
              Terms & Conditions
            </Link>
            <Link href="/faqs" className="hover:text-[var(--accent)]">
              FAQs
            </Link>
            <Link href="/track-order" className="hover:text-[var(--accent)]">
              Track order
            </Link>
            <Link href="/about" className="hover:text-[var(--accent)]">
              About
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--line)] px-4 py-4 text-center text-[11px] leading-relaxed tracking-wide text-[var(--fg-muted)]">
        <p>
          © {new Date().getFullYear()} {STORE_NAME}. Operated by{" "}
          <span className="text-[var(--footer-fg)]">{TRADE_NAME}</span>.
        </p>
        <p className="mt-1">
          All prices in INR. Payments processed securely via PhonePe.
        </p>
      </div>
    </footer>
  );
}
