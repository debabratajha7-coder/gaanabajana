import { connectDB } from "@/lib/db";
import { PageContent } from "@/models/PageContent";
import { getSiteSettings } from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  await connectDB().catch(() => null);
  const [page, settings] = await Promise.all([
    PageContent.findOne({ key: "contact" }).lean().catch(() => null),
    getSiteSettings().catch(() => null),
  ]);
  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        {page?.title || "Contact Us"}
      </h1>
      <div
        className="prose-gb mt-6 max-w-2xl"
        dangerouslySetInnerHTML={{ __html: page?.body || "" }}
      />
      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
        <p>Phone: {settings?.phone}</p>
        <p className="mt-2">Email: {settings?.email}</p>
        {settings?.whatsapp && <p className="mt-2">WhatsApp: {settings.whatsapp}</p>}
      </div>
    </div>
  );
}
