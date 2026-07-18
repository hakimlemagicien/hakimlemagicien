import { createFileRoute } from "@tanstack/react-router";
import { IntervalTimerScreen } from "@/components/platform/timer/IntervalTimerScreen";

export const Route = createFileRoute("/_platform/app/tools/timer")({
  head: () => ({ meta: [{ title: "تايمر التدريبات | Hakim Platform" }] }),
  component: IntervalTimerScreen,
});
