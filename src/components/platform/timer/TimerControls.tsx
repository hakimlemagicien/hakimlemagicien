import { ChevronLeft, Pause, Play, RotateCcw, SkipForward, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerControlsProps = {
  runStatus: "idle" | "running" | "paused" | "completed";
  presetName: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onReset: () => void;
  onStop: () => void;
  onRestart: () => void;
  onBackToTools: () => void;
};

export function TimerControls({
  runStatus,
  presetName,
  onStart,
  onPause,
  onResume,
  onSkip,
  onReset,
  onStop,
  onRestart,
  onBackToTools,
}: TimerControlsProps) {
  if (runStatus === "completed") {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={onRestart}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] text-[14px] font-black text-white shadow-[0_10px_24px_-12px_rgba(255,107,0,0.85)]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          إعادة التمرين
        </button>
        <button
          type="button"
          onClick={onBackToTools}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#F1F5F9] text-[13px] font-extrabold text-[#475569]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          العودة إلى الأدوات
        </button>
      </div>
    );
  }

  if (runStatus === "idle") {
    return (
      <button
        type="button"
        onClick={onStart}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-6 text-[15px] font-black text-white shadow-[0_10px_24px_-12px_rgba(255,107,0,0.85)] active:scale-[0.99]"
      >
        <Play className="h-5 w-5 fill-current" aria-hidden />
        ابدأ {presetName}
      </button>
    );
  }

  if (runStatus === "paused") {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          aria-label="إعادة"
          className="flex min-h-11 flex-col items-center justify-center rounded-2xl bg-[#F8FAFC] text-[11px] font-extrabold text-[#64748B] ring-1 ring-[#E2E8F0]"
        >
          <RotateCcw className="mb-0.5 h-4 w-4" />
          إعادة
        </button>
        <button
          type="button"
          onClick={onResume}
          className="flex min-h-12 min-w-[132px] items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-5 text-[14px] font-black text-white"
        >
          <Play className="h-5 w-5 fill-current" aria-hidden />
          متابعة
        </button>
        <button
          type="button"
          onClick={onStop}
          aria-label="إنهاء"
          className="flex min-h-11 flex-col items-center justify-center rounded-2xl bg-[#F8FAFC] text-[11px] font-extrabold text-[#64748B] ring-1 ring-[#E2E8F0]"
        >
          <Square className="mb-0.5 h-4 w-4" />
          إنهاء
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <button
        type="button"
        onClick={onSkip}
        aria-label="تخطي المرحلة"
        className="flex min-h-11 flex-col items-center justify-center rounded-2xl bg-[#F8FAFC] text-[11px] font-extrabold text-[#64748B] ring-1 ring-[#E2E8F0] active:scale-[0.98]"
      >
        <SkipForward className="mb-0.5 h-4 w-4" />
        تخطي
      </button>
      <button
        type="button"
        onClick={onPause}
        className={cn(
          "flex min-h-12 min-w-[132px] items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-5 text-[14px] font-black text-white active:scale-[0.99]",
        )}
      >
        <Pause className="h-5 w-5" aria-hidden />
        إيقاف مؤقت
      </button>
      <button
        type="button"
        onClick={onStop}
        aria-label="إنهاء"
        className="flex min-h-11 flex-col items-center justify-center rounded-2xl bg-[#F8FAFC] text-[11px] font-extrabold text-[#64748B] ring-1 ring-[#E2E8F0] active:scale-[0.98]"
      >
        <Square className="mb-0.5 h-4 w-4" />
        إنهاء
      </button>
    </div>
  );
}
