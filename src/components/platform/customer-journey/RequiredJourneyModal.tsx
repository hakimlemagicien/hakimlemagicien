import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type RequiredJourneyModalProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function RequiredJourneyModal({
  icon,
  title,
  description,
  children,
  footer,
}: RequiredJourneyModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keepOpen = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("keydown", keepOpen, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keepOpen, true);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[170] flex items-center justify-center overflow-y-auto bg-foreground/35 px-4 py-[max(1rem,env(safe-area-inset-top))] backdrop-blur-[8px]"
      dir="rtl"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative my-auto w-full max-w-md overflow-hidden rounded-[30px] border border-white/70 bg-card/95 p-5 text-center shadow-[0_30px_80px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-6"
      >
        <span className="absolute inset-x-16 top-0 h-1 rounded-b-full bg-primary" />
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/15 bg-primary-soft text-2xl text-primary shadow-sm">
          {icon}
        </div>
        <p className="mt-3 text-[10px] font-black tracking-wide text-primary">إعداد خطتك الشخصية</p>
        <h2 id={titleId} className="mt-1.5 text-xl font-black leading-tight text-foreground">
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mx-auto mt-2 max-w-sm text-xs font-medium leading-relaxed text-muted-foreground"
        >
          {description}
        </p>
        <div className="mt-5">{children}</div>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </section>
    </div>,
    document.body,
  );
}
