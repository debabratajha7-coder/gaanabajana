import { connectDB } from "@/lib/db";
import { PageContent } from "@/models/PageContent";
import { getSiteSettings } from "@/models/SiteSettings";
import { STORE_NAME, TRADE_NAME } from "@/lib/brand";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  await connectDB().catch(() => null);
  const [page, settings] = await Promise.all([
    PageContent.findOne({ key: "contact" }).lean().catch(() => null),
    getSiteSettings().catch(() => null),
  ]);

  const phones = (settings?.phone || "")
    .split(/[,|·•]/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        {page?.title || "Contact Us"}
      </h1>
      {page?.body ? (
        <div
          className="prose-gb mt-6 max-w-2xl"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.body) }}
        />
      ) : (
        <p className="mt-6 max-w-2xl text-[var(--fg-muted)]">
          Reach {STORE_NAME} ({TRADE_NAME}) for product questions, orders, and
          returns.
        </p>
      )}

      <div className="glass-panel mt-8 max-w-xl space-y-4 p-6">
        <div>
          <p className="eyebrow">Business / trade name</p>
          <p className="mt-2 text-sm font-medium">{TRADE_NAME}</p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">
            Online store: {STORE_NAME}
          </p>
        </div>
        <div>
          <p className="eyebrow">Phone</p>
          <div className="mt-2 space-y-1 text-sm">
            {phones.length ? (
              phones.map((p: string) => (
                <p key={p}>
                  <a href={`tel:${p.replace(/\s+/g, "")}`} className="hover:text-[var(--accent)]">
                    {p}
                  </a>
                </p>
              ))
            ) : (
              <p className="text-[var(--fg-muted)]">Not set</p>
            )}
          </div>
        </div>
        <div>
          <p className="eyebrow">Email</p>
          <p className="mt-2 text-sm">
            {settings?.email ? (
              <a href={`mailto:${settings.email}`} className="hover:text-[var(--accent)]">
                {settings.email}
              </a>
            ) : (
              "Not set"
            )}
          </p>
        </div>
        {settings?.whatsapp && (
          <div>
            <p className="eyebrow">WhatsApp</p>
            <p className="mt-2 text-sm">{settings.whatsapp}</p>
          </div>
        )}
        <div>
          <p className="eyebrow">Address</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
            {settings?.address ||
              "M9VC F4C Medical More, Kawakhari, West Bengal, 734011, India"}
          </p>
        </div>
        <p className="text-xs text-[var(--fg-muted)]">
          Monday–Saturday, 10:00 AM – 7:00 PM IST
        </p>
      </div>
    </div>
  );
}
