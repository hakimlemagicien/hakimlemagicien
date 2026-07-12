import { ChevronLeft } from "lucide-react";
import { getQuizProgressBarState } from "@/lib/quiz-step-progress";

const ORANGE = "#FF6B00";

function ProgressSegments({ step, trackClassName = "bg-black/10" }: { step: string; trackClassName?: string }) {
  const { displayStep, total, segmentFill } = getQuizProgressBarState(step);

  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const milestone = i + 1;
        let fill = 0;
        if (milestone < displayStep) fill = 1;
        else if (milestone === displayStep) fill = segmentFill;

        return (
          <div key={i} className={`h-1.5 flex-1 overflow-hidden rounded-full ${trackClassName}`}>
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${fill * 100}%`, background: ORANGE }}
            />
          </div>
        );
      })}
    </div>
  );
}

type QuizProgressHeaderProps = {
  step: string;
  onBack?: () => void;
};

export function QuizProgressHeader({ step, onBack }: QuizProgressHeaderProps) {
  const { displayStep, total } = getQuizProgressBarState(step);

  return (
    <>
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-700" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <div className="text-sm font-bold text-neutral-800">
          <span style={{ color: ORANGE }}>{displayStep}</span> من {total}
        </div>
        <div className="w-10" />
      </div>
      <div className="mt-3">
        <ProgressSegments step={step} />
      </div>
    </>
  );
}

/** Compact label + bar for congrats / reveal screens */
export function QuizProgressStrip({ step }: { step: string }) {
  const { displayStep, total } = getQuizProgressBarState(step);

  return (
    <>
      <div className="mb-2 text-center text-[12px] font-bold text-neutral-500">
        {displayStep} من {total}
      </div>
      <ProgressSegments step={step} trackClassName="bg-[#ECE8E1]" />
    </>
  );
}
