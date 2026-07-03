import { Link } from "@tanstack/react-router";
import {
  LEGAL_ROUTES,
  SITE_BRAND,
  SITE_LEGAL_ENTITY,
  SITE_SUPPORT_EMAIL,
  SITE_WHATSAPP_URL,
} from "@/lib/site-legal";

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      dir="rtl"
      className={`border-t border-black/[0.06] bg-white ${compact ? "py-6" : "py-10 mt-10"}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className={`grid gap-6 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
          <div className="text-start">
            <div className="font-[Cairo] text-[16px] font-black text-[#0F172A]">{SITE_BRAND}</div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600">
              برامج تدريب وتغذية رقمية مخصصة لتحقيق أهدافك خلال 90 يوماً، مع متابعة ودعم حسب الباقة
              المختارة.
            </p>
          </div>

          {!compact && (
            <div className="text-start">
              <div className="text-[13px] font-black text-[#0F172A]">روابط قانونية</div>
              <ul className="mt-3 space-y-2 text-[13px] font-bold text-neutral-600">
                <li>
                  <Link to={LEGAL_ROUTES.privacy} className="hover:text-primary">
                    سياسة الخصوصية
                  </Link>
                </li>
                <li>
                  <Link to={LEGAL_ROUTES.terms} className="hover:text-primary">
                    الشروط والأحكام
                  </Link>
                </li>
                <li>
                  <Link to={LEGAL_ROUTES.refund} className="hover:text-primary">
                    سياسة الاسترجاع والإلغاء
                  </Link>
                </li>
              </ul>
            </div>
          )}

          <div className="text-start">
            <div className="text-[13px] font-black text-[#0F172A]">التواصل</div>
            <ul className="mt-3 space-y-2 text-[12.5px] text-neutral-600">
              <li>{SITE_LEGAL_ENTITY}</li>
              <li>
                <a href={`mailto:${SITE_SUPPORT_EMAIL}`} className="font-bold hover:text-primary">
                  {SITE_SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <a href={SITE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-bold hover:text-primary">
                  واتساب الدعم
                </a>
              </li>
            </ul>
          </div>
        </div>

        {compact && (
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11.5px] font-bold text-neutral-500">
            <Link to={LEGAL_ROUTES.privacy} className="hover:text-primary">
              الخصوصية
            </Link>
            <Link to={LEGAL_ROUTES.terms} className="hover:text-primary">
              الشروط
            </Link>
            <Link to={LEGAL_ROUTES.refund} className="hover:text-primary">
              الاسترجاع
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-neutral-400">
          © {new Date().getFullYear()} {SITE_BRAND}. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
