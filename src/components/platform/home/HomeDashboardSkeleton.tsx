import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton layout matching the home dashboard section order. */
export function HomeDashboardSkeleton() {
  return (
    <div className="platform-home-skeleton" aria-busy="true" aria-label="جاري تحميل الصفحة الرئيسية">
      <div className="platform-home-skeleton__header">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-[30px] w-[52px] rounded-md" />
        <div className="flex justify-end gap-1.5">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <Skeleton className="h-[340px] w-full rounded-[24px]" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[112px] rounded-2xl" />
          ))}
        </div>
      </div>

      <Skeleton className="h-[132px] w-full rounded-[22px]" />
      <Skeleton className="h-[110px] w-full rounded-[22px]" />

      <div className="flex gap-2.5 overflow-hidden">
        <Skeleton className="aspect-[4/5] w-[72%] shrink-0 rounded-[22px]" />
        <Skeleton className="aspect-[4/5] w-[72%] shrink-0 rounded-[22px]" />
      </div>
      <Skeleton className="h-[72px] w-full rounded-[22px]" />
      <Skeleton className="h-[280px] w-full rounded-[28px]" />
    </div>
  );
}
