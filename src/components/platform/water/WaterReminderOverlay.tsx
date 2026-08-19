import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Droplets } from "lucide-react";
import { WaterCupsFace } from "@/components/platform/water/NutritionWaterCard";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import { WATER_SEED } from "@/lib/platform/seed-content";
import { formatWaterLiters } from "@/lib/platform/water-storage";

const REMINDER_MESSAGES = [
  "جسمك يفقد الماء طوال اليوم. كوب الآن يحافظ على طاقتك وتركيزك حتى المساء.",
  "الترطيب المستمر يقلل التعب ويساعد عضلاتك على الاستشفاء بعد التمرين.",
  "لا تنتظر العطش — شرب الماء بانتظام يحمي أداءك خلال اليوم.",
  "كل كوب يقرّبك من هدفك ويبقي جسمك جاهزاً للعمل والتمرين.",
  "الماء ليس مهمة لمرة واحدة. وزّعه على اليوم لتحافظ على نشاطك.",
];

export function WaterReminderOverlay() {
  const water = useWaterOptional();
  const reduceMotion = useReducedMotion();
  const reminderOpen = water?.reminderOpen ?? false;
  const skipWaterReminder = water?.skipWaterReminder;

  useEffect(() => {
    if (!reminderOpen || !skipWaterReminder) return;
    document.body.classList.add("is-water-open");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") skipWaterReminder();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("is-water-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [reminderOpen, skipWaterReminder]);

  if (!water || typeof document === "undefined") return null;

  const {
    registerWater,
    loading,
    state,
  } = water;
  const current = formatWaterLiters(state.totalMl);
  const goal = formatWaterLiters(state.goalMl, 0);
  const pct = state.goalMl > 0 ? Math.min(state.totalMl / state.goalMl, 1) : 0;
  const message = REMINDER_MESSAGES[state.logs.length % REMINDER_MESSAGES.length]!;
  const glassMl = WATER_SEED.glassMl;
  const duration = reduceMotion ? 0 : 0.22;

  return createPortal(
    <AnimatePresence>
      {reminderOpen ? (
        <motion.div
          className="water-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          <button
            type="button"
            aria-label="تخطي التذكير"
            className="water-overlay__backdrop"
            onClick={skipWaterReminder}
          />

          <motion.div
            className="water-overlay__wrap"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="water-reminder-title"
              dir="rtl"
              className="water-overlay__card"
            >
              <div className="flex items-center justify-center gap-2 text-center">
                <Droplets className="h-5 w-5 text-sky-500" />
                <h2 id="water-reminder-title" className="text-base font-black text-sky-950">
                  وقت شرب الماء
                </h2>
              </div>

              <div className="mt-4">
                <WaterCupsFace current={current} goal={goal} pct={pct} done={state.goalReached} />
              </div>

              <p className="mt-4 text-center text-[13px] font-bold leading-relaxed text-sky-900">
                {message}
              </p>

              <button
                type="button"
                disabled={loading}
                onClick={() => void registerWater(glassMl)}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 text-[14px] font-black text-white shadow-[0_10px_22px_-12px_rgba(14,165,233,0.7)] transition active:scale-[0.98] disabled:opacity-70"
              >
                <Droplets className="h-4 w-4" />
                اشرب كوباً الآن · {glassMl} ml
              </button>
              <p className="mt-2 text-center text-[11px] font-medium text-sky-800/75">
                أو تخطَّ التذكير — سنعود بعد 30 دقيقة
              </p>
            </section>

            <button type="button" className="water-overlay__cancel" onClick={skipWaterReminder}>
              تخطي
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
