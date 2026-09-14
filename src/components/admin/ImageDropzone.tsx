"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { ImageCropModal } from "@/components/admin/ImageCropModal";

type ImageDropzoneProps = {
  values: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  alt?: string;
  label?: string;
  className?: string;
  /** Crop frame: 1 = square, 16/9 = wide banner, 4/3 = category tile */
  aspect?: number;
};

type PendingCrop = {
  src: string;
  fileName: string;
  queue: File[];
};

export function ImageDropzone({
  values,
  onChange,
  multiple = false,
  alt = "",
  label = "Drop image here or click to upload",
  className = "",
  aspect = 1,
}: ImageDropzoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingCrop | null>(null);
  const [collected, setCollected] = useState<string[]>([]);

  function startQueue(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const queue = multiple ? list : list.slice(0, 1);
    const first = queue[0];
    setError("");
    setCollected([]);
    setPending({
      src: URL.createObjectURL(first),
      fileName: first.name,
      queue: queue.slice(1),
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function closePending(src?: string) {
    if (src) URL.revokeObjectURL(src);
    setPending(null);
  }

  async function uploadCropped(file: File, already: string[]) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("alt", alt || file.name);
    const res = await fetch("/api/admin/media", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    if (!data.media?.url) throw new Error("No image returned");
    return [...already, data.media.url as string];
  }

  async function onCropConfirm(file: File) {
    if (!pending) return;
    const currentSrc = pending.src;
    const rest = pending.queue;
    setUploading(true);
    setError("");
    try {
      const nextCollected = await uploadCropped(file, collected);
      URL.revokeObjectURL(currentSrc);

      if (rest.length > 0) {
        const next = rest[0];
        setCollected(nextCollected);
        setPending({
          src: URL.createObjectURL(next),
          fileName: next.name,
          queue: rest.slice(1),
        });
      } else {
        setPending(null);
        setCollected([]);
        onChange(multiple ? [...values, ...nextCollected] : nextCollected);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      closePending(currentSrc);
      setCollected([]);
    } finally {
      setUploading(false);
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
          if (e.target.files?.length) startQueue(e.target.files);
        }}
      />
      <button
        type="button"
        disabled={uploading || Boolean(pending)}
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
          if (e.dataTransfer.files?.length) startQueue(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
            <span className="text-[var(--fg-muted)]">Uploading framed photo…</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-[var(--accent)]" />
            <span className="font-medium">{label}</span>
            <span className="text-xs text-[var(--fg-muted)]">
              Preview → zoom & move → then upload
            </span>
          </>
        )}
      </button>

      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}

      {values.length > 0 && (
        <div
          className={`mt-3 grid gap-2 ${multiple ? "grid-cols-3" : "grid-cols-1 max-w-xs"}`}
        >
          {values.map((url) => (
            <div
              key={url}
              className="relative overflow-hidden border border-[var(--line)] bg-[var(--bg-soft)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className={
                  multiple ? "aspect-square object-cover" : "aspect-video w-full object-cover"
                }
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

      {pending && (
        <ImageCropModal
          imageSrc={pending.src}
          fileName={pending.fileName}
          defaultAspect={aspect}
          onCancel={() => {
            closePending(pending.src);
            setCollected([]);
          }}
          onConfirm={(file) => void onCropConfirm(file)}
        />
      )}
    </div>
  );
}
