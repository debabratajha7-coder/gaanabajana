"use client";

import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const { toast } = useToast();

  if (items.length === 0) {
    return (
      <div className="mesh-bg">
      <div className="container-gb flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
        <div className="glass-panel-strong max-w-md p-8">
        <p className="eyebrow">Cart</p>
        <h1 className="display mt-3 text-3xl sm:text-4xl">Your cart is empty</h1>
        <p className="mt-3 max-w-sm text-[var(--fg-muted)]">
          Browse bestsellers and add something you love.
        </p>
        <Link href="/collections/guitars" className="btn btn-primary mt-8">
          Continue shopping
        </Link>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="mesh-bg">
    <div className="container-gb grid gap-8 py-10 lg:grid-cols-[1fr_320px] lg:gap-12">
      <div>
        <p className="eyebrow">Your bag</p>
        <h1 className="display mt-2 text-3xl sm:text-4xl">Cart</h1>
        <div className="mt-8 space-y-3">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantName}`}
              className="glass-panel flex gap-4 p-3.5 sm:p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt=""
                className="h-24 w-24 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.slug}`} className="font-medium leading-snug">
                  {item.title}
                </Link>
                {item.variantName && (
                  <p className="mt-0.5 text-sm text-[var(--fg-muted)]">{item.variantName}</p>
                )}
                <p className="mt-1.5 font-medium text-[var(--price)]">
                  {formatINR(item.price)}
                </p>
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
                    onClick={() => {
                      removeItem(item.productId, item.variantName);
                      toast("Removed from cart");
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="glass-panel-strong h-fit p-6">
        <p className="text-sm text-[var(--fg-muted)]">Subtotal</p>
        <p className="mt-1 text-3xl font-semibold text-[var(--price)]">
          {formatINR(subtotal)}
        </p>
        <p className="mt-2 text-xs text-[var(--fg-muted)]">
          Shipping calculated at checkout
        </p>
        <Link href="/checkout" className="btn btn-primary mt-6 w-full">
          Checkout
        </Link>
        <Link
          href="/collections/guitars"
          className="mt-3 block text-center text-sm text-[var(--fg-muted)] hover:text-[var(--accent)]"
        >
          Keep shopping
        </Link>
      </aside>
    </div>
    </div>
  );
}
