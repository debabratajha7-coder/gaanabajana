import { cn } from "@/lib/utils";

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-2 p-3 sm:p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-4 w-20" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="fade-in-soft min-h-[100dvh]">
      <div className="container-gb pt-4 sm:pt-6">
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="container-gb grid grid-cols-1 gap-3 py-4 sm:gap-4 sm:py-8 lg:grid-cols-[72px_minmax(0,1.1fr)_minmax(300px,400px)] lg:items-start lg:gap-6">
        {/* Match PDP mobile order: gallery first */}
        <Skeleton className="order-1 aspect-square w-full lg:order-2" />
        <div className="order-2 hidden flex-col gap-2 lg:order-1 lg:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] w-[68px]" />
          ))}
        </div>
        <div className="order-3 space-y-4 lg:col-span-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductSecondarySkeleton() {
  return (
    <div className="container-gb space-y-8 border-t border-[var(--line)] py-10">
      <div>
        <Skeleton className="h-7 w-36" />
        <Skeleton className="mt-2 h-4 w-56" />
        <div className="mt-6">
          <ProductGridSkeleton count={4} />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-20 w-full max-w-2xl" />
      </div>
    </div>
  );
}

export function CollectionSkeleton() {
  return (
    <div className="container-gb py-10">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-10 w-56 sm:w-72" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />
      <div className="mt-10">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-gb section-gb space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="aspect-[16/10] w-full" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="mt-4 h-12 w-40 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div>
      <Skeleton className="min-h-[70vh] w-full rounded-none" />
      <div className="container-gb section-gb space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="scroll-row md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-[4/3] w-[70vw] max-w-[260px] md:w-auto md:max-w-none"
            />
          ))}
        </div>
      </div>
      <div className="container-gb pb-16">
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
