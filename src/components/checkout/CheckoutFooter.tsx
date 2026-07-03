import { Link } from "@tanstack/react-router";
import { ChevronLeft, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEGAL_ROUTES, SITE_SUPPORT_EMAIL } from "@/lib/site-legal";
import { PaddleLogo } from "./payment-logos";

type CheckoutFooterProps = {
  className?: string;
};

export function CheckoutFooter({ className }: CheckoutFooterProps) {
  const links = [
    { to: LEGAL_ROUTES.terms, label: "الشروط" },
    { to: LEGAL_ROUTES.privacy, label: "الخصوصية" },
    { to: LEGAL_ROUTES.refund, label: "الاسترجاع" },
  ] as const;

  return (
    <footer className={cn("mt-5 space-y-3 font-[Tajawal]", className)}>
      <div className="overflow-hidden rounded-2xl border border-[#ECECEC] bg-white checkout-shadow">
        <a
          href={`mailto:${SITE_SUPPORT_EMAIL}`}
          className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-[#FAFAFA]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF3ED] text-[#FF5A1F]">
            <Mail className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-start">
            <p className="text-[13px] font-bold leading-tight text-[#0F172A]">تحتاج مساعدة؟</p>
            <p className="mt-0.5 truncate text-[12px] font-semibold text-[#FF5A1F]">{SITE_SUPPORT_EMAIL}</p>
          </div>
          <ChevronLeft className="h-4 w-4 shrink-0 text-[#C4C4C4]" aria-hidden />
        </a>

        <nav
          aria-label="روابط قانونية"
          className="flex items-center justify-center gap-2 border-t border-[#ECECEC] px-3 py-2.5 text-[11px] text-[#6B7280]"
        >
          {links.map((link, i) => (
            <span key={link.to} className="inline-flex items-center gap-2">
              {i > 0 ? <span className="text-[#D1D5DB]" aria-hidden>·</span> : null}
              <Link to={link.to} className="font-semibold hover:text-[#FF5A1F]">
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center justify-center gap-2 px-1 text-center">
        <PaddleLogo />
        <p className="text-[10px] leading-[1.4] text-[#9CA3AF]">
          دفع آمن عبر Paddle · SSL
        </p>
      </div>
    </footer>
  );
}
