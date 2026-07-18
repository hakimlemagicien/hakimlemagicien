import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton layout matching the CEO-approved home dashboard section order. */
export function HomeDashboardSkeleton() {
  return (
    <div className="platform-home-skeleton" aria-busy="true" aria-label="جاري تحميل الصفحة الرئيسية">
      <div className="platform-home-skeleton__header">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      <Skeleton className="h-[340px] w-full rounded-[24px]" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[108px] rounded-[20px]" />
          ))}
        </div>
      </div>

      <Skeleton className="h-[168px] w-full rounded-[24px]" />

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-[148px] rounded-[24px]" />
        <Skeleton className="h-[148px] rounded-[24px]" />
      </div>

      <Skeleton className="h-[132px] w-full rounded-[24px]" />
      <Skeleton className="h-[96px] w-full rounded-[24px]" />
    </div>
  );
}
