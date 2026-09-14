import Link from "next/link";

export default function CheckoutFailedPage() {
  return (
    <div className="container-gb py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Payment failed</h1>
      <p className="mt-3 text-[var(--fg-muted)]">
        No charges were completed. You can try checkout again.
      </p>
      <Link href="/checkout" className="btn btn-primary mt-6">
        Retry checkout
      </Link>
    </div>
  );
}
