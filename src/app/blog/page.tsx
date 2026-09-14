import Link from "next/link";
import { connectDB } from "@/lib/db";
import { BlogPost } from "@/models/BlogPost";

export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  await connectDB();
  const posts = await BlogPost.find({ published: true }).sort({ publishedAt: -1 }).lean();
  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Blog</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={String(post._id)}
            href={`/blog/${post.slug}`}
            className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]"
          >
            {post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.coverImage} alt="" className="aspect-[16/9] w-full object-cover" />
            )}
            <div className="p-5">
              <h2 className="font-[family-name:var(--font-display)] text-2xl">{post.title}</h2>
              <p className="mt-2 text-[var(--fg-muted)]">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
