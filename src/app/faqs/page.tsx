import { connectDB } from "@/lib/db";
import { PageContent } from "@/models/PageContent";

export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  await connectDB().catch(() => null);
  const page = await PageContent.findOne({ key: "faqs" }).lean().catch(() => null);
  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        {page?.title || "FAQs"}
      </h1>
      <div
        className="prose-gb mt-8 max-w-3xl"
        dangerouslySetInnerHTML={{ __html: page?.body || "" }}
      />
    </div>
  );
}
