"use client";

import {
  type MotionValue,
  useMotionValueEvent,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const COLS = 18;
const ROWS = 12;
const MAX_DPR = 1.5;

type HeroPaperCrumpleProps = {
  image: string;
  progress: MotionValue<number>;
  className?: string;
};

type Pt = { x: number; y: number };

function coverSource(
  imgW: number,
  imgH: number,
  viewW: number,
  viewH: number
) {
  const scale = Math.max(viewW / imgW, viewH / imgH);
  const sw = viewW / scale;
  const sh = viewH / scale;
  return {
    sx: (imgW - sw) / 2,
    sy: (imgH - sh) / 2,
    sw,
    sh,
  };
}

/** Affine map source triangle → dest triangle, then drawImage. */
function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  s0: Pt,
  s1: Pt,
  s2: Pt,
  d0: Pt,
  d1: Pt,
  d2: Pt,
  dpr: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0.x * dpr, d0.y * dpr);
  ctx.lineTo(d1.x * dpr, d1.y * dpr);
  ctx.lineTo(d2.x * dpr, d2.y * dpr);
  ctx.closePath();
  ctx.clip();

  const denom =
    s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(denom) < 1e-4) {
    ctx.restore();
    return;
  }

  const m11 =
    (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) /
    denom;
  const m12 =
    (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) /
    denom;
  const m21 =
    (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) /
    denom;
  const m22 =
    (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) /
    denom;
  const dx =
    (d0.x * (s1.x * s2.y - s2.x * s1.y) +
      d1.x * (s2.x * s0.y - s0.x * s2.y) +
      d2.x * (s0.x * s1.y - s1.x * s0.y)) /
    denom;
  const dy =
    (d0.y * (s1.x * s2.y - s2.x * s1.y) +
      d1.y * (s2.x * s0.y - s0.x * s2.y) +
      d2.y * (s0.x * s1.y - s1.x * s0.y)) /
    denom;

  ctx.setTransform(
    m11 * dpr,
    m12 * dpr,
    m21 * dpr,
    m22 * dpr,
    dx * dpr,
    dy * dpr
  );
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function deformVertex(
  u: number,
  v: number,
  w: number,
  h: number,
  t: number
): Pt & { shade: number } {
  const x0 = u * w;
  const y0 = v * h;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const dx = x0 - cx;
  const dy = y0 - cy;
  const r = Math.hypot(dx, dy) || 1;
  const rMax = Math.hypot(cx, cy);
  const rn = r / rMax;

  const collapse = Math.pow(t, 1.35);
  const ballR = Math.min(w, h) * (0.11 + 0.04 * (1 - rn));
  const targetR = r * (1 - collapse) + ballR * collapse;

  const crease =
    Math.sin(u * 14.2 + t * 2.4) *
      Math.cos(v * 11.7 - t * 1.8) *
      Math.sin((u + v) * 8.3 + t) *
      t *
      (28 + 36 * t) +
    Math.sin(u * 31 - v * 19 + t * 4) * t * t * 14;

  const baseAng = Math.atan2(dy, dx);
  const twist = t * 1.35 * (0.35 + rn) + crease * 0.008;
  const ang = baseAng + twist;

  const radialJitter = crease * (0.35 + 0.65 * t);
  const x = cx + Math.cos(ang) * (targetR + radialJitter * 0.35);
  const y = cy + Math.sin(ang) * (targetR + radialJitter * 0.35);

  const px = -Math.sin(ang);
  const py = Math.cos(ang);
  const fold = crease * (0.55 + 0.45 * collapse);

  const shade = Math.min(
    0.55,
    Math.abs(crease) * 0.012 * (0.4 + t) + collapse * rn * 0.18
  );

  return {
    x: x + px * fold,
    y: y + py * fold,
    shade,
  };
}

export function HeroPaperCrumple({
  image,
  progress,
  className,
}: HeroPaperCrumpleProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const tRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const dirtyRef = useRef(true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useMotionValueEvent(progress, "change", (v) => {
    tRef.current = v;
    dirtyRef.current = true;
    if (v > 0.001 && !runningRef.current) {
      startLoop();
    }
  });

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const { w, h, dpr } = sizeRef.current;
    if (w < 2 || h < 2) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      setFailed(true);
      return;
    }

    const t = Math.max(0, Math.min(1, tRef.current));
    const cw = Math.floor(w * dpr);
    const ch = Math.floor(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Keep a solid fill so crumple never punches a hole into the next section
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(0, 0, cw, ch);

    const src = coverSource(img.naturalWidth, img.naturalHeight, w, h);

    if (t < 0.002) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, w, h);
      dirtyRef.current = false;
      return;
    }

    const verts: (Pt & { shade: number; su: number; sv: number })[] = [];
    for (let j = 0; j <= ROWS; j++) {
      for (let i = 0; i <= COLS; i++) {
        const u = i / COLS;
        const v = j / ROWS;
        const d = deformVertex(u, v, w, h, t);
        verts.push({
          ...d,
          su: src.sx + u * src.sw,
          sv: src.sy + v * src.sh,
        });
      }
    }

    const idx = (i: number, j: number) => j * (COLS + 1) + i;

    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const a = verts[idx(i, j)]!;
        const b = verts[idx(i + 1, j)]!;
        const c = verts[idx(i, j + 1)]!;
        const d = verts[idx(i + 1, j + 1)]!;

        drawTexturedTriangle(
          ctx,
          img,
          { x: a.su, y: a.sv },
          { x: b.su, y: b.sv },
          { x: c.su, y: c.sv },
          { x: a.x, y: a.y },
          { x: b.x, y: b.y },
          { x: c.x, y: c.y },
          dpr
        );
        drawTexturedTriangle(
          ctx,
          img,
          { x: b.su, y: b.sv },
          { x: d.su, y: d.sv },
          { x: c.su, y: c.sv },
          { x: b.x, y: b.y },
          { x: d.x, y: d.y },
          { x: c.x, y: c.y },
          dpr
        );

        const shade = (a.shade + b.shade + c.shade + d.shade) / 4;
        if (shade > 0.02) {
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineTo(d.x, d.y);
          ctx.lineTo(c.x, c.y);
          ctx.closePath();
          ctx.fillStyle = `rgba(0,0,0,${Math.min(0.5, shade)})`;
          ctx.fill();
          ctx.restore();
        }
      }
    }

    dirtyRef.current = false;
  }

  function startLoop() {
    if (runningRef.current) return;
    runningRef.current = true;
    const tick = () => {
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (dirtyRef.current) draw();
      if (tRef.current > 0.001 || dirtyRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        runningRef.current = false;
        draw();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      imgRef.current = img;
      setReady(true);
      dirtyRef.current = true;
      startLoop();
    };
    img.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    img.src = image;
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      sizeRef.current = {
        w: Math.max(1, Math.floor(rect.width)),
        h: Math.max(1, Math.floor(rect.height)),
        dpr,
      };
      dirtyRef.current = true;
      if (!runningRef.current) startLoop();
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const onVis = () => {
      if (!document.hidden) {
        dirtyRef.current = true;
        startLoop();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    tRef.current = progress.get();
    dirtyRef.current = true;
    startLoop();

    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, ready]);

  if (failed) {
    return (
      <div className={cn("absolute inset-0", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={cn("absolute inset-0", className)}>
      {!ready && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden
      />
    </div>
  );
}
