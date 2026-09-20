"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";

export type PdpThemeMode = "dark" | "light";

type PdpThemeTokens = {
  page: string;
  panel: string;
  border: string;
  fg: string;
  muted: string;
  /** Hex without # for Cloudinary b_rgb */
  imgBg: string;
  pixelColors: string[];
};

const TOKENS: Record<PdpThemeMode, PdpThemeTokens> = {
  dark: {
    page: "#0a0a0a",
    panel: "#141414",
    border: "rgba(255,255,255,0.1)",
    fg: "#ffffff",
    muted: "rgba(255,255,255,0.5)",
    imgBg: "141414",
    pixelColors: ["#ffffff", "#d4d4d4", "#a3a3a3", "#737373"],
  },
  light: {
    page: "#f7f5f3",
    panel: "#ffffff",
    border: "rgba(0,0,0,0.08)",
    fg: "#111111",
    muted: "#666666",
    imgBg: "FFFFFF",
    pixelColors: ["#c8102e", "#8f0b20", "#111111", "#d4d4d4"],
  },
};

type PdpThemeContextValue = {
  theme: PdpThemeMode;
  tokens: PdpThemeTokens;
  setTheme: (mode: PdpThemeMode) => void;
  toggleTheme: () => void;
};

const PdpThemeContext = createContext<PdpThemeContextValue | null>(null);

const STORAGE_KEY = "site-theme";
const LEGACY_KEY = "pdp-theme";

function applyHtmlTheme(mode: PdpThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", mode);
}

/** Sitewide light/dark — Header toggle + storefront + PDP. */
export function PdpThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const [theme, setThemeState] = useState<PdpThemeMode>("light");

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
        if (!isAdmin) applyHtmlTheme(stored);
        return;
      }
    } catch {
      /* ignore */
    }
    if (!isAdmin) applyHtmlTheme("light");
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      applyHtmlTheme("light");
      return;
    }
    applyHtmlTheme(theme);
  }, [theme, isAdmin]);

  const setTheme = useCallback(
    (mode: PdpThemeMode) => {
      setThemeState(mode);
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        /* ignore */
      }
      if (!isAdmin) applyHtmlTheme(mode);
    },
    [isAdmin]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: PdpThemeMode = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      if (!isAdmin) applyHtmlTheme(next);
      return next;
    });
  }, [isAdmin]);

  const tokens = TOKENS[isAdmin ? "light" : theme];

  const value = useMemo(
    () => ({
      theme: isAdmin ? ("light" as const) : theme,
      tokens,
      setTheme,
      toggleTheme,
    }),
    [theme, tokens, setTheme, toggleTheme, isAdmin]
  );

  return (
    <PdpThemeContext.Provider value={value}>{children}</PdpThemeContext.Provider>
  );
}

/** PDP shell — pixel canvas host; inherits site theme tokens. */
export function PdpThemeShell({ children }: { children: ReactNode }) {
  const { theme } = usePdpTheme();

  return (
    <div
      className="fade-in-soft relative isolate transition-colors duration-300"
      data-pdp-theme={theme}
    >
      {children}
    </div>
  );
}

export function usePdpTheme() {
  const ctx = useContext(PdpThemeContext);
  if (!ctx) {
    throw new Error("usePdpTheme must be used within PdpThemeProvider");
  }
  return ctx;
}

export function usePdpThemeOptional() {
  return useContext(PdpThemeContext);
}

export function PdpThemeToggle({ className }: { className?: string }) {
  const ctx = usePdpThemeOptional();
  const pathname = usePathname();
  if (!ctx) return null;
  if (pathname?.startsWith("/admin")) return null;

  const { theme, toggleTheme } = ctx;
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className || "icon-btn"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
