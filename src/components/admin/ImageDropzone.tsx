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
};

const CONCURRENCY = 3;
const MAX_BATCH = 20;

async function uploadOne(file: File, alt: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("alt", alt || file.name);
  const res = await fetch("/api/admin/media", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Upload failed: ${file.name}`);
  if (!data.media?.url) throw new Error(`No image returned for ${file.name}`);
  return data.media.url as string;
}

/** Upload with concurrency; preserve input order for successes. */
async function uploadPool(
  files: File[],
  alt: string,
  limit: number,
  onProgress?: (done: number, total: number) => void
): Promise<{ urls: string[]; errors: string[] }> {
  const results: (string | null)[] = Array(files.length).fill(null);
  const errors: string[] = [];
  let cursor = 0;
  let done = 0;
  const total = files.length;

  async function run() {
    while (cursor < files.length) {
      const i = cursor++;
      const file = files[i];
      try {
        results[i] = await uploadOne(file, alt);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Upload failed");
      } finally {
        done += 1;
        onProgress?.(done, total);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, files.length) }, () => run())
  );

  return {
    urls: results.filter((u): u is string => Boolean(u)),
    errors,
  };
}

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
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingCrop | null>(null);

  function clearInput() {
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadBatch(files: File[]) {
    const list = files.slice(0, MAX_BATCH);
    if (!list.length) return;

    setUploading(true);
    setError("");
    setProgress({ done: 0, total: list.length });

    const { urls, errors } = await uploadPool(
      list,
      alt,
      CONCURRENCY,
      (done, total) => setProgress({ done, total })
    );

    if (urls.length) {
      onChange(multiple ? [...valuesRef.current, ...urls] : urls.slice(0, 1));
    }

    if (errors.length) {
      const extra =
        files.length > MAX_BATCH
          ? ` (max ${MAX_BATCH} at once; extra files skipped)`
          : "";
      setError(
        urls.length
          ? `Uploaded ${urls.length} of ${list.length}. Failed: ${errors.slice(0, 3).join("; ")}${extra}`
          : `Upload failed: ${errors[0]}${extra}`
      );
    } else if (files.length > MAX_BATCH) {
      setError(`Uploaded ${urls.length}. Max ${MAX_BATCH} images per batch.`);
    } else {
      setError("");
    }

    setUploading(false);
    setProgress(null);
    clearInput();
  }

  function startFromFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      setError("Choose image files (JPEG, PNG, WebP, GIF, or AVIF).");
      return;
    }

    // Multi: upload all at once (no per-file crop gate)
    if (multiple) {
      void uploadBatch(list);
      return;
    }

    // Single: keep crop → upload flow
    const first = list[0];
    setError("");
    setPending({
      src: URL.createObjectURL(first),
      fileName: first.name,
    });
    clearInput();
  }

  function closePending() {
    if (pending?.src) URL.revokeObjectURL(pending.src);
    setPending(null);
  }

  async function onCropConfirm(file: File) {
    if (!pending) return;
    setUploading(true);
    setError("");
    setProgress({ done: 0, total: 1 });
    try {
      const url = await uploadOne(file, alt);
      onChange([url]);
      closePending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      closePending();
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  function removeAt(url: string) {
    onChange(values.filter((u) => u !== url));
  }

  const progressLabel =
    progress && progress.total > 1
      ? `Uploading ${progress.done} of ${progress.total}…`
      : "Uploading…";

  return (
    <div className={className}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) startFromFiles(e.target.files);
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
          if (e.dataTransfer.files?.length) startFromFiles(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
            <span className="font-medium text-[var(--fg)]">{progressLabel}</span>
            {progress && progress.total > 1 ? (
              <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{
                    width: `${Math.round((progress.done / progress.total) * 100)}%`,
                  }}
                />
              </div>
            ) : null}
            <span className="text-xs text-[var(--fg-muted)]">
              Keep this tab open until uploads finish
            </span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-[var(--accent)]" />
            <span className="font-medium">{label}</span>
            <span className="text-xs text-[var(--fg-muted)]">
              {multiple
                ? `Select or drop up to ${MAX_BATCH} images — they upload together`
                : "Preview → zoom & move → then upload"}
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
                  multiple
                    ? "aspect-square w-full object-contain"
                    : "aspect-video w-full object-contain"
                }
              />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white"
                onClick={() => removeAt(url)}
                aria-label="Remove image"
                disabled={uploading}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {pending && !multiple && (
        <ImageCropModal
          imageSrc={pending.src}
          fileName={pending.fileName}
          defaultAspect={aspect}
          onCancel={closePending}
          onConfirm={(file) => void onCropConfirm(file)}
        />
      )}
    </div>
  );
}
