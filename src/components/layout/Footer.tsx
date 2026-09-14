import Link from "next/link";

type Settings = {
  storeName?: string;
  phone?: string;
  email?: string;
  tagline?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
};

export function Footer({ settings }: { settings?: Settings }) {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--bg-elevated)]">
      <div className="container-gb grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-[family-name:var(--font-display)] text-3xl">
            {settings?.storeName || "Gaanbajana"}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
            {settings?.tagline ||
              "Musical instruments & audio gear for every stage."}
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Shop
          </p>
          <div className="grid gap-2 text-sm">
            <Link href="/collections/guitars">Guitars</Link>
            <Link href="/collections/keyboards-pianos">Keyboards</Link>
            <Link href="/collections/drums-percussion">Drums</Link>
            <Link href="/deals">Deals</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Help
          </p>
          <div className="grid gap-2 text-sm">
            <Link href="/faqs">FAQs</Link>
            <Link href="/policies/shipping">Shipping</Link>
            <Link href="/policies/returns">Returns</Link>
            <Link href="/track-order">Track order</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Company
          </p>
          <div className="grid gap-2 text-sm">
            <Link href="/about">About</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/policies/privacy">Privacy</Link>
            <Link href="/policies/terms">Terms</Link>
            <p className="pt-2 text-[var(--fg-muted)]">
              {settings?.phone}
              <br />
              {settings?.email}
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--line)] py-4 text-center text-xs text-[var(--fg-muted)]">
        © {new Date().getFullYear()} Gaanbajana. Payments via Cashfree · Shipping via Shiprocket.
      </div>
    </footer>
  );
}
