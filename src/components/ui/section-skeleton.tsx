import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SectionSkeletonProps = {
  variant?: "cards" | "text" | "hero" | "list";
  className?: string;
};

/** Placeholder shown while below-fold landing sections load via code splitting. */
export function SectionSkeleton({ variant = "cards", className }: SectionSkeletonProps) {
  if (variant === "hero") {
    return (
      <div className={cn("mx-auto max-w-7xl px-4 py-16", className)} aria-hidden>
        <Skeleton className="mx-auto h-10 w-3/4 max-w-lg" />
        <Skeleton className="mx-auto mt-4 h-5 w-2/3 max-w-md" />
        <Skeleton className="mx-auto mt-10 h-64 w-full max-w-sm rounded-3xl" />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={cn("mx-auto max-w-3xl space-y-3 px-4 py-12", className)} aria-hidden>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-3 px-4 py-6", className)} aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3", className)} aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
      ))}
    </div>
  );
}
