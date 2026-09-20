/** Sample dominant / vibrant colors from an image URL (client-only). */

type Rgb = { r: number; g: number; b: number };

function rgbToHex({ r, g, b }: Rgb): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function luminance({ r, g, b }: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === min) return 0;
  const l = (max + min) / 2;
  return (max - min) / (l > 0.5 ? 2 - max - min : max + min);
}

function deepen(hex: string, amount = 0.28): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = Math.round(parseInt(m[1]!, 16) * (1 - amount));
  const g = Math.round(parseInt(m[2]!, 16) * (1 - amount));
  const b = Math.round(parseInt(m[3]!, 16) * (1 - amount));
  return rgbToHex({ r, g, b });
}

function normalizeHex(hex: string): string | null {
  const m = /^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1]!;
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return `#${h.toLowerCase()}`;
}

/**
 * Extract up to `count` vivid colors from an image.
 * Returns [] on CORS / decode failure — callers should fall back to swatches.
 */
export async function extractImageColors(
  src: string,
  count = 4
): Promise<string[]> {
  if (!src || typeof window === "undefined") return [];

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    const finish = (colors: string[]) => resolve(colors);

    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return finish([]);

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map<string, { rgb: Rgb; weight: number }>();

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3]!;
          if (a < 200) continue;
          const r = data[i]!;
          const g = data[i + 1]!;
          const b = data[i + 2]!;
          const rgb = { r, g, b };
          const lum = luminance(rgb);
          const sat = saturation(rgb);
          // Skip near-white / near-black / gray noise
          if (lum > 0.92 || lum < 0.06 || sat < 0.12) continue;

          const key = `${r >> 4},${g >> 4},${b >> 4}`;
          const weight = sat * (1 - Math.abs(lum - 0.45)) + 0.15;
          const prev = buckets.get(key);
          if (prev) {
            prev.weight += weight;
            prev.rgb = {
              r: Math.round((prev.rgb.r + r) / 2),
              g: Math.round((prev.rgb.g + g) / 2),
              b: Math.round((prev.rgb.b + b) / 2),
            };
          } else {
            buckets.set(key, { rgb, weight });
          }
        }

        const ranked = [...buckets.values()]
          .sort((a, b) => b.weight - a.weight)
          .slice(0, count)
          .map((b) => deepen(rgbToHex(b.rgb)));

        finish(ranked);
      } catch {
        finish([]);
      }
    };

    img.onerror = () => finish([]);
    img.src = src;
  });
}

/** Merge swatch + extracted colors into a 4-stop ambient palette. */
export function buildAmbientPalette(
  extracted: string[],
  swatch?: string | null,
  fallback: string[] = ["#1a3a6b", "#0d4f3c", "#1a1a3a", "#0a2040"]
): string[] {
  const seed = swatch ? normalizeHex(swatch) : null;
  const deepenedSeed = seed ? deepen(seed, 0.15) : null;
  const uniq: string[] = [];
  for (const c of [deepenedSeed, ...extracted, ...fallback]) {
    if (!c) continue;
    const n = normalizeHex(c);
    if (!n) continue;
    if (uniq.some((u) => u === n)) continue;
    uniq.push(n);
    if (uniq.length >= 4) break;
  }
  while (uniq.length < 4) uniq.push(fallback[uniq.length]!);
  return uniq;
}
