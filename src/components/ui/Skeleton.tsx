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
            <Skeleton key={i} className="aspect-[4/3] w-[70vw] max-w-[260px] md:w-auto md:max-w-none" />
          ))}
        </div>
      </div>
      <div className="container-gb pb-16">
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
