"use client";

import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { formatINR } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-gb py-20 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-[var(--fg-muted)]">Not sure where to start?</p>
        <Link href="/collections/guitars" className="btn btn-primary mt-6">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-gb grid gap-10 py-10 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Cart</h1>
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantName}`}
              className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt=""
                className="h-24 w-24 rounded-xl object-cover"
              />
              <div className="flex-1">
                <Link href={`/products/${item.slug}`} className="font-medium">
                  {item.title}
                </Link>
                {item.variantName && (
                  <p className="text-sm text-[var(--fg-muted)]">{item.variantName}</p>
                )}
                <p className="mt-1 text-[var(--accent)]">{formatINR(item.price)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) =>
                      updateQty(item.productId, Number(e.target.value), item.variantName)
                    }
                    className="input w-20"
                  />
                  <button
                    type="button"
                    className="text-sm text-[var(--danger)]"
                    onClick={() => removeItem(item.productId, item.variantName)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside className="h-fit rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
        <p className="text-sm text-[var(--fg-muted)]">Subtotal</p>
        <p className="mt-1 text-3xl text-[var(--accent)]">{formatINR(subtotal)}</p>
        <p className="mt-2 text-xs text-[var(--fg-muted)]">
          Shipping calculated at checkout
        </p>
        <Link href="/checkout" className="btn btn-primary mt-6 w-full">
          Checkout
        </Link>
      </aside>
    </div>
  );
}
