import { Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import appLogo from "@/assets/app-logo.png";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { LEGAL_ROUTES, SITE_SUPPORT_EMAIL, SITE_WHATSAPP_URL } from "@/lib/site-legal";

const PRODUCT_LINKS = [
  { label: "عن تطبيق MAAKFIT", hash: "about" },
  { label: "كيف يعمل التطبيق", hash: "how" },
  { label: "الباقات", hash: "pricing" },
  { label: "الأسئلة الشائعة", hash: "faq" },
] as const;

const LEGAL_LINKS = [
  { label: "اتصل بنا", to: LEGAL_ROUTES.contact },
  { label: "سياسة الخصوصية", to: LEGAL_ROUTES.privacy },
  { label: "الشروط والأحكام", to: LEGAL_ROUTES.terms },
  { label: "الاسترداد والإلغاء", to: LEGAL_ROUTES.refund },
] as const;

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer dir="rtl" className="border-t border-black/[0.06] bg-white py-6">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11.5px] font-bold text-neutral-500">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.label} to={link.to} className="hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-center font-[Tajawal] text-[11px] text-neutral-400">
            © {new Date().getFullYear()} جميع الحقوق محفوظة لـ MAAKFIT
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer
      id="about"
      dir="rtl"
      className="relative overflow-hidden border-t border-[#EEE8E1] bg-[#0F172A] font-[Tajawal,Cairo,sans-serif] text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#FF6B00]/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-[#22A95D]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-l from-[#FF6B00] to-[#FF8A3D] p-5 shadow-[0_28px_70px_-32px_rgba(255,107,0,0.85)] sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="text-center lg:text-right">
            <p className="text-[11px] font-extrabold tracking-wide text-white/75 sm:text-[12px]">
              ابدأ من FREE
            </p>
            <h2 className="mt-1 text-[24px] font-black leading-tight sm:text-[34px]">
              تطبيقك اليومي للتدريب والتغذية والتقدم
            </h2>
            <p className="mt-2 max-w-2xl text-[12px] font-semibold leading-relaxed text-white/80 sm:text-[14px]">
              أنشئ حسابك، أكمل التقييم، ثم تابع تجربتك الرقمية كاملة داخل MAAKFIT.
            </p>
          </div>
          <Link
            to="/"
            className="group mx-auto mt-5 flex min-h-[50px] w-full max-w-[300px] items-center justify-between rounded-full bg-white px-2 text-[#FF6B00] shadow-lg transition hover:-translate-y-0.5 lg:mx-0 lg:mt-0"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#FFF1E6]">
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                strokeWidth={2.5}
              />
            </span>
            <span className="flex-1 text-center text-[14px] font-black">ابدأ تجربتك المجانية</span>
            <span className="w-10" aria-hidden />
          </Link>
        </div>

        <div className="mt-10 grid gap-9 text-center md:grid-cols-[1.25fr_0.8fr_0.9fr] md:text-right">
          <div>
            <Link to="/coaching" className="inline-flex items-center gap-3">
              <img
                src={appLogo}
                alt="MAAKFIT"
                className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
              />
              <span className="font-[Cairo] text-[25px] font-black tracking-tight">MAAKFIT</span>
            </Link>
            <p className="mx-auto mt-4 max-w-md text-[13px] font-medium leading-[1.9] text-slate-300 md:mx-0">
              تطبيق Fitness رقمي كامل يجمع التدريب والتغذية والقياسات وتتبع التقدم والترطيب داخل
              حساب واحد.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
              {["FREE", "PLUS", "PRO"].map((plan) => (
                <span
                  key={plan}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-extrabold text-white/80"
                >
                  {plan}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[14px] font-black text-white">التطبيق</h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to="/coaching"
                    hash={link.hash}
                    className="text-[13px] font-semibold text-slate-300 transition hover:text-[#FF8A3D]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] font-black text-white">الدعم والسياسات</h3>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[13px] font-semibold text-slate-300 transition hover:text-[#FF8A3D]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
          <a
            href={`mailto:${SITE_SUPPORT_EMAIL}`}
            className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[12px] font-bold text-slate-200 transition hover:border-[#FF8A3D]/40 hover:bg-white/[0.08] sm:justify-start"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FF6B00]/15 text-[#FF8A3D]">
              <Mail className="h-4 w-4" />
            </span>
            {SITE_SUPPORT_EMAIL}
          </a>
          <a
            href={SITE_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[12px] font-bold text-slate-200 transition hover:border-[#25D366]/40 hover:bg-white/[0.08] sm:justify-start"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#25D366]/15 text-[#25D366]">
              <WhatsAppIcon className="h-4 w-4" />
            </span>
            واتساب لدعم الحساب والفوترة والمشاكل التقنية
          </a>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-right">
          <p className="text-[11px] font-medium text-slate-400">
            © {new Date().getFullYear()} جميع الحقوق محفوظة لـ MAAKFIT
          </p>
          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <ShieldCheck className="h-4 w-4 text-[#22A95D]" />
            منتج رقمي — لا توجد شحنة أو تسليم خارج التطبيق
          </div>
        </div>
      </div>
    </footer>
  );
}
