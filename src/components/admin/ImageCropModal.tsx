"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImageBlob } from "@/lib/crop-image";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";

const ASPECTS: { label: string; value: number | undefined }[] = [
  { label: "Square", value: 1 },
  { label: "Wide", value: 16 / 9 },
  { label: "Photo", value: 4 / 3 },
  { label: "Tall", value: 3 / 4 },
];

type ImageCropModalProps = {
  imageSrc: string;
  fileName: string;
  defaultAspect?: number;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export function ImageCropModal({
  imageSrc,
  fileName,
  defaultAspect = 1,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(defaultAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function confirm() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setError("");
    try {
      const file = await getCroppedImageBlob(imageSrc, croppedAreaPixels, fileName);
      onConfirm(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not crop");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col border border-[var(--line)] bg-[var(--bg-elevated)] shadow-2xl">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <h2 className="display text-2xl">Frame your photo</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Drag to move. Use the slider to zoom. Then tap Use this photo.
          </p>
        </div>

        <div className="relative mx-5 mt-4 h-[min(52vh,420px)] overflow-hidden bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            showGrid
          />
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button
                key={a.label}
                type="button"
                className={`btn btn-ghost btn-sm ${
                  aspect === a.value ? "border-[var(--fg)] font-semibold" : ""
                }`}
                onClick={() => setAspect(a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 shrink-0 text-[var(--fg-muted)]" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[var(--fg)]"
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-[var(--fg-muted)]" />
            <span className="w-10 shrink-0 text-right text-xs text-[var(--fg-muted)]">
              {zoom.toFixed(1)}×
            </span>
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void confirm()}
              disabled={busy || !croppedAreaPixels}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Preparing…
                </>
              ) : (
                "Use this photo"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
