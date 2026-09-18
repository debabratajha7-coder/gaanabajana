"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Soft recovery UI for cold DB / serverless blips.
 * Auto-refreshes the RSC tree a few times instead of a dead-end error page.
 * Attempt count is stored in sessionStorage so it survives router.refresh().
 */
export function AutoRetry({
  title = "Taking a moment…",
  message = "We’re waking the catalog up. This usually only takes a second.",
  maxAttempts = 3,
  delayMs = 1500,
  storageKey,
}: {
  title?: string;
  message?: string;
  maxAttempts?: number;
  delayMs?: number;
  /** Optional key; defaults to pathname. */
  storageKey?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const key = `gb-autoretry:${storageKey || pathname}`;
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const scheduled = useRef(false);

  useEffect(() => {
    try {
      const n = Number(sessionStorage.getItem(key) || "0");
      setAttempt(Number.isFinite(n) ? n : 0);
    } catch {
      setAttempt(0);
    }
    setReady(true);
  }, [key]);

  const gaveUp = ready && attempt >= maxAttempts;

  useEffect(() => {
    if (!ready || gaveUp || scheduled.current) return;
    scheduled.current = true;

    const timer = setTimeout(() => {
      const next = attempt + 1;
      try {
        sessionStorage.setItem(key, String(next));
      } catch {
        /* ignore */
      }
      setAttempt(next);
      router.refresh();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [ready, gaveUp, attempt, delayMs, key, router]);

  function tryAgain() {
    try {
      sessionStorage.setItem(key, "0");
    } catch {
      /* ignore */
    }
    scheduled.current = false;
    setAttempt(0);
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="container-gb py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[var(--fg-muted)]">{message}</p>
      </div>
    );
  }

  return (
    <div className="container-gb py-16 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        {gaveUp ? "Still waking up" : title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[var(--fg-muted)]">
        {gaveUp ? "Please try again in a moment." : message}
      </p>
      {!gaveUp && (
        <p className="mt-2 text-xs text-[var(--fg-muted)]">
          Retry {Math.min(attempt + 1, maxAttempts)} of {maxAttempts}
        </p>
      )}
      <button type="button" className="btn btn-primary mt-6" onClick={tryAgain}>
        Try again
      </button>
    </div>
  );
}

/** Clear retry counter after a successful page load (call from a tiny client child). */
export function ClearAutoRetry({ storageKey }: { storageKey?: string }) {
  const pathname = usePathname();
  useEffect(() => {
    try {
      sessionStorage.removeItem(`gb-autoretry:${storageKey || pathname}`);
    } catch {
      /* ignore */
    }
  }, [pathname, storageKey]);
  return null;
}
