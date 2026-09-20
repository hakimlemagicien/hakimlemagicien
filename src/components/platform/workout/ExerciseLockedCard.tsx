import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExerciseLockedCardProps = {
  index: number;
  isLast?: boolean;
  isActive?: boolean;
  onUnlock: () => void;
};

export function ExerciseLockedCard({
  index,
  isLast = false,
  isActive = false,
  onUnlock,
}: ExerciseLockedCardProps) {
  return (
    <button
      type="button"
      onClick={onUnlock}
      className={cn(
        "workout-exercise-row flex w-full items-center gap-2.5 px-3 py-3 text-right transition active:bg-muted/25",
        !isLast && "border-b border-border/40",
        isActive && "workout-exercise-row--current relative z-[1] py-3.5",
      )}
      dir="rtl"
      aria-label={`التمرين ${index} مقفل. فعّل برنامجك الكامل للوصول إلى التفاصيل.`}
    >
      <span className="relative z-[1] grid w-7 shrink-0 place-items-center">
        <span className="grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-primary/40 bg-card text-[11px] font-black text-primary/70">
          {index}
        </span>
      </span>

      <div
        className={cn(
          "relative aspect-square shrink-0 overflow-hidden rounded-md border bg-card opacity-80",
          isActive ? "size-[88px] border-primary/40" : "size-[74px] border-border/60",
        )}
      >
        <span
          aria-hidden
          className="absolute inset-[-12px] bg-[radial-gradient(circle_at_30%_25%,rgba(249,115,22,0.9),transparent_38%),linear-gradient(135deg,#334155,#0f172a_58%,#475569)] blur-[10px]"
        />
        <span className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[3px]">
          <Lock className="h-4 w-4 text-white drop-shadow-sm" strokeWidth={2.4} />
        </span>
      </div>

      <div className="min-w-0 flex-1 text-right opacity-75">
        <p className={cn("font-black leading-snug text-foreground", isActive ? "text-[13px]" : "text-[12px]")}>
          تمرين مخصص مقفل
        </p>
        <p className="mt-0.5 text-[10px] font-bold text-primary">مقفل — فعّل برنامجك الكامل</p>
        <p className="mt-0.5 text-[10px] font-medium leading-snug text-muted-foreground">
          الاسم والصورة والتفاصيل محمية
        </p>
      </div>

      <Lock className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
    </button>
  );
}

export function ExerciseUnlockedStatusIcon({ isDone }: { isDone: boolean }) {
  if (isDone) {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }

  return <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] border-primary bg-card" />;
}
