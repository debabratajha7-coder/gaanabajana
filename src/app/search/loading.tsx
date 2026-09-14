import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container-gb py-12">
      <Skeleton className="h-9 w-40" />
      <div className="mt-8">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
