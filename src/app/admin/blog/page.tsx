"use client";

import { FormEvent, useEffect, useState } from "react";

type Post = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  published: boolean;
  coverImage?: string;
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    body: "",
    coverImage: "",
    published: true,
  });

  function load() {
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []));
  }

  useEffect(load, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", excerpt: "", body: "", coverImage: "", published: true });
    load();
  }

  async function remove(id: string) {
    await fetch("/api/admin/blog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Blog</h1>
        <ul className="mt-4 space-y-3">
          {posts.map((p) => (
            <li key={p._id} className="rounded-xl border border-[var(--line)] p-3">
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-[var(--fg-muted)]">
                /{p.slug} · {p.published ? "Published" : "Draft"}
              </p>
              <button
                type="button"
                className="mt-2 text-sm text-[var(--danger)]"
                onClick={() => remove(p._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={onCreate} className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">New post</h2>
        <input
          className="input"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Excerpt"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />
        <input
          className="input"
          placeholder="Cover image URL"
          value={form.coverImage}
          onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
        />
        <textarea
          className="input min-h-40"
          placeholder="Body HTML"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Published
        </label>
        <button className="btn btn-primary" type="submit">
          Create post
        </button>
      </form>
    </div>
  );
}
