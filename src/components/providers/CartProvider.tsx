"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  image?: string;
  price: number;
  mrp: number;
  qty: number;
  variantName?: string;
  sku?: string;
  weightKg: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: string, variantName?: string) => void;
  updateQty: (productId: string, qty: number, variantName?: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "gaanbajana_cart";

function keyOf(item: { productId: string; variantName?: string }) {
  return `${item.productId}::${item.variantName || ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      addItem: (item, qty = 1) => {
        setItems((prev) => {
          const k = keyOf(item);
          const existing = prev.find((p) => keyOf(p) === k);
          if (existing) {
            return prev.map((p) =>
              keyOf(p) === k ? { ...p, qty: p.qty + qty } : p
            );
          }
          return [...prev, { ...item, qty }];
        });
      },
      removeItem: (productId, variantName) => {
        setItems((prev) =>
          prev.filter((p) => keyOf(p) !== keyOf({ productId, variantName }))
        );
      },
      updateQty: (productId, qty, variantName) => {
        setItems((prev) =>
          prev
            .map((p) =>
              keyOf(p) === keyOf({ productId, variantName })
                ? { ...p, qty: Math.max(1, qty) }
                : p
            )
            .filter((p) => p.qty > 0)
        );
      },
      clear: () => setItems([]),
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
