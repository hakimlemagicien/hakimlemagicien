import { Link } from "@tanstack/react-router";

/** Persistent login entry shown at the top of the quiz funnel ( / and /quiz ). */
export function QuizLoginEntry() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
      aria-label="تسجيل الدخول"
    >
      <Link
        to="/auth"
        search={{ view: "login" }}
        className="pointer-events-auto rounded-full border border-black/8 bg-white/92 px-3.5 py-1.5 text-[12px] font-bold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
      >
        لديك حساب؟{" "}
        <span className="text-primary underline-offset-2 hover:underline">تسجيل الدخول</span>
      </Link>
    </div>
  );
}
