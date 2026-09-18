import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { PageContent } from "@/models/PageContent";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const KEY_MAP: Record<string, string> = {
  shipping: "shipping",
  returns: "returns",
  warranty: "warranty",
  privacy: "privacy",
  terms: "terms",
};

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const key = KEY_MAP[slug];
  if (!key) notFound();
  await connectDB();
  const page = await PageContent.findOne({ key }).lean();
  if (!page) notFound();
  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        {page.title}
      </h1>
      <div
        className="prose-gb mt-8 max-w-3xl"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.body || "") }}
      />
    </div>
  );
}
