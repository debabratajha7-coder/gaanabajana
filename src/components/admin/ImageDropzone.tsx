"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

type ImageDropzoneProps = {
  /** Current image URL(s). Single mode uses values[0]. */
  values: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  alt?: string;
  label?: string;
  className?: string;
};

export function ImageDropzone({
  values,
  onChange,
  multiple = false,
  alt = "",
  label = "Drop image here or click to upload",
  className = "",
}: ImageDropzoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;

    const toUpload = multiple ? list : list.slice(0, 1);
    setUploading(true);
    setError("");

    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("alt", alt || file.name);
        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        if (data.media?.url) uploaded.push(data.media.url);
      }
      if (!uploaded.length) throw new Error("No image returned");
      onChange(multiple ? [...values, ...uploaded] : uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeAt(url: string) {
    onChange(values.filter((u) => u !== url));
  }

  return (
    <div className={className}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files);
        }}
      />
      <button
        type="button"
        disabled={uploading}
        className={`flex w-full flex-col items-center justify-center gap-2 border border-dashed px-4 py-8 text-sm transition ${
          dragging
            ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]"
            : "border-[var(--line-strong)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]"
        }`}
        onClick={() => fileRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
            <span className="text-[var(--fg-muted)]">Uploading to Cloudinary…</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-[var(--accent)]" />
            <span className="font-medium">{label}</span>
            <span className="text-xs text-[var(--fg-muted)]">
              {multiple ? "PNG, JPG, WEBP — multiple allowed" : "PNG, JPG, WEBP"}
            </span>
          </>
        )}
      </button>

      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}

      {values.length > 0 && (
        <div className={`mt-3 grid gap-2 ${multiple ? "grid-cols-3" : "grid-cols-1 max-w-xs"}`}>
          {values.map((url) => (
            <div
              key={url}
              className="relative overflow-hidden border border-[var(--line)] bg-[var(--bg-soft)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className={multiple ? "aspect-square object-cover" : "aspect-video w-full object-cover"}
              />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white"
                onClick={() => removeAt(url)}
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
