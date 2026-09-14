import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { BlogPost } from "@/models/BlogPost";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();
  const post = await BlogPost.findOne({ slug, published: true }).lean();
  if (!post) notFound();
  return (
    <article className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">
        {post.title}
      </h1>
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt=""
          className="mt-8 aspect-[16/9] w-full max-w-4xl rounded-2xl object-cover"
        />
      )}
      <div
        className="prose-gb mt-8 max-w-3xl"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </article>
  );
}
