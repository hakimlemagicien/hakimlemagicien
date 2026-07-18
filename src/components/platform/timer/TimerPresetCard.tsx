import { cn } from "@/lib/utils";
import type { TimerPreset } from "@/lib/platform/timer/types";
import { formatTimerClock } from "@/lib/platform/timer/interval-timer-engine";

type TimerPresetCardProps = {
  preset: TimerPreset;
  selected: boolean;
  disabled?: boolean;
  highlight?: string;
  onSelect: () => void;
};

const PRESET_TONES: Record<string, string> = {
  tabata: "border-[#FF6B00]/40 bg-[#FFF7ED]",
  "hiit-beginner": "border-[#6366F1]/30 bg-[#EEF2FF]",
  "fat-burn": "border-[#22C55E]/30 bg-[#F0FDF4]",
  boxing: "border-[#A855F7]/30 bg-[#FAF5FF]",
};

export function TimerPresetCard({
  preset,
  selected,
  disabled,
  highlight,
  onSelect,
}: TimerPresetCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative min-w-[148px] shrink-0 rounded-[20px] border p-3 text-right transition active:scale-[0.98] disabled:opacity-60",
        PRESET_TONES[preset.id] ?? "border-[#E2E8F0] bg-white",
        selected && "ring-2 ring-[#FF6B00]",
      )}
    >
      {highlight ? (
        <span className="absolute left-2 top-2 rounded-full bg-[#FF6B00] px-2 py-0.5 text-[9px] font-black text-white">
          {highlight}
        </span>
      ) : null}
      <p className="text-[13px] font-black text-[#0F172A]">{preset.name}</p>
      <p className="mt-1 text-[10px] font-bold text-[#64748B]">
        {formatTimerClock(preset.workSeconds)} عمل · {formatTimerClock(preset.restSeconds)} راحة
      </p>
      <p className="mt-0.5 text-[10px] font-medium text-[#94A3B8]">{preset.rounds} جولات</p>
    </button>
  );
}
