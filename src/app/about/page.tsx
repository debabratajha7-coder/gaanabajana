import { connectDB } from "@/lib/db";
import { PageContent } from "@/models/PageContent";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

async function getPage(key: string) {
  try {
    await connectDB();
    return PageContent.findOne({ key }).lean();
  } catch {
    return null;
  }
}

export default async function AboutPage() {
  const page = await getPage("about");
  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">
        {page?.title || "About Gaanabajana"}
      </h1>
      <div
        className="prose-gb mt-8 max-w-3xl"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(
            page?.body ||
              "<p>Gaanabajana is an online music store for Indian musicians.</p>"
          ),
        }}
      />
    </div>
  );
}
