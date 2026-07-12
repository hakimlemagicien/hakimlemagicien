import { Lightbulb } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const QUIZ_ORANGE = "#FF6B00";

type QuizImportantInfoNoteProps = {
  text: string;
  label?: string;
  delayMs?: number;
  icon?: ReactNode;
  /** Inline label + text (default) or stacked title + body */
  layout?: "inline" | "stacked";
};

export function QuizImportantInfoNote({
  text,
  label = "معلومة مهمة",
  delayMs = 3000,
  icon,
  layout = "inline",
}: QuizImportantInfoNoteProps) {
  const [visible, setVisible] = useState(false);
  const stacked = layout === "stacked";

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return (
    <div
      aria-live="polite"
      className="overflow-hidden"
      style={{
        maxHeight: visible ? (stacked ? 88 : 52) : 0,
        opacity: visible ? 1 : 0,
        marginTop: visible ? 8 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition:
          "max-height 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.55s ease, margin-top 0.55s ease",
      }}
    >
      <div
        className={`quiz-info-note flex flex-row-reverse gap-2.5 rounded-[18px] px-3 py-2.5 ${
          stacked ? "items-start" : "items-center"
        }`}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,251,245,0.96) 0%, rgba(255,244,232,0.9) 100%)",
          border: "1px dashed rgba(255,107,0,0.2)",
          borderRight: "2px solid rgba(255,107,0,0.4)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 3px 10px -8px rgba(255,107,0,0.15)",
        }}
      >
        <div
          className={`quiz-info-note__icon grid shrink-0 place-items-center rounded-lg ${
            stacked ? "mt-0.5 h-8 w-8" : "h-7 w-7"
          }`}
          style={{
            background: "linear-gradient(145deg, rgba(255,107,0,0.12) 0%, rgba(255,138,61,0.06) 100%)",
            border: "1px solid rgba(255,107,0,0.14)",
          }}
        >
          {icon ?? (
            <Lightbulb
              size={stacked ? 15 : 14}
              style={{ color: QUIZ_ORANGE }}
              strokeWidth={2.4}
            />
          )}
        </div>
        {stacked ? (
          <div className="min-w-0 flex-1 text-right">
            <div className="text-[11.5px] font-extrabold leading-tight" style={{ color: QUIZ_ORANGE }}>
              {label}
            </div>
            <p className="mt-0.5 text-[10.5px] font-medium leading-[1.4] text-[#5C534A]">{text}</p>
          </div>
        ) : (
          <p className="min-w-0 flex-1 text-right text-[10.5px] font-medium leading-[1.35] text-[#5C534A]">
            <span className="font-extrabold" style={{ color: QUIZ_ORANGE }}>
              {label}:
            </span>{" "}
            {text}
          </p>
        )}
      </div>
    </div>
  );
}
