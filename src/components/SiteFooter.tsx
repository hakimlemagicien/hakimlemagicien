import { Link } from "@tanstack/react-router";
import {
  LEGAL_ROUTES,
  SITE_SUPPORT_EMAIL,
  SITE_WHATSAPP_URL,
} from "@/lib/site-legal";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .55.04.81.1v-3.5a6.37 6.37 0 0 0-.81-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.85 4.85 0 0 1-1-.15z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 9h3V6h-3c-1.6 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.8 15.5v-7l6.3 3.5-6.3 3.5z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "YouTube", href: "https://youtube.com", Icon: YouTubeIcon },
  { label: "TikTok", href: "https://tiktok.com", Icon: TikTokIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
] as const;

const FOOTER_COLUMNS = [
  {
    title: "الشركة",
    links: [
      { label: "من نحن", to: "/" },
      { label: "المدونة", to: "/" },
      { label: "وظائف", to: "/" },
    ],
  },
  {
    title: "الدعم",
    links: [
      { label: "اتصل بنا", href: `mailto:${SITE_SUPPORT_EMAIL}` },
      { label: "سياسة الخصوصية", to: LEGAL_ROUTES.privacy },
      { label: "الشروط والأحكام", to: LEGAL_ROUTES.terms },
    ],
  },
  {
    title: "المنصة",
    links: [
      { label: "الصفحة الرئيسية", to: "/" },
      { label: "كيف تعمل", to: "/", hash: "how" },
      { label: "الباقات", to: "/", hash: "pricing" },
      { label: "الأسئلة الشائعة", to: "/", hash: "faq" },
    ],
  },
] as const;

function FooterLink({
  label,
  to,
  hash,
  href,
}: {
  label: string;
  to?: string;
  hash?: string;
  href?: string;
}) {
  const className =
    "font-[Tajawal] text-[13px] font-medium text-[#64748B] transition-colors hover:text-primary";

  if (href) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link to={to ?? "/"} hash={hash} className={className}>
      {label}
    </Link>
  );
}

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer dir="rtl" className="border-t border-black/[0.06] bg-white py-6">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11.5px] font-bold text-neutral-500">
            <Link to={LEGAL_ROUTES.privacy} className="hover:text-primary">
              الخصوصية
            </Link>
            <Link to={LEGAL_ROUTES.terms} className="hover:text-primary">
              الشروط
            </Link>
            <Link to={LEGAL_ROUTES.refund} className="hover:text-primary">
              الاسترجاع
            </Link>
            <a href={SITE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              واتساب
            </a>
          </div>
          <p className="mt-4 text-center font-[Tajawal] text-[11px] text-neutral-400">
            © {new Date().getFullYear()} جميع الحقوق محفوظة لـ Hakim Coaching
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer dir="rtl" className="relative overflow-hidden border-t border-black/[0.06] bg-white py-12 sm:py-14">
      <span
        aria-hidden
        className="footer-atmosphere-dot pointer-events-none absolute bottom-8 left-[10%] h-2 w-2 rounded-full bg-[#FF6B00]/30"
        style={{ animationDelay: "0s" }}
      />
      <span
        aria-hidden
        className="footer-atmosphere-dot pointer-events-none absolute bottom-14 left-[22%] h-1.5 w-1.5 rounded-full bg-[#FF6B00]/25"
        style={{ animationDelay: "0.9s" }}
      />
      <span
        aria-hidden
        className="footer-atmosphere-dot pointer-events-none absolute bottom-10 right-[14%] h-2.5 w-2.5 rounded-full bg-[#FF6B00]/28"
        style={{ animationDelay: "1.5s" }}
      />
      <span
        aria-hidden
        className="footer-atmosphere-dot pointer-events-none absolute bottom-16 right-[28%] h-1 w-1 rounded-full bg-[#FF6B00]/35"
        style={{ animationDelay: "2.1s" }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="inline-flex flex-col items-center">
            <span className="font-[Cairo] text-[28px] font-black leading-none tracking-tight text-primary sm:text-[32px]">
              HAKIM
            </span>
            <span className="mt-1 font-[Cairo] text-[11px] font-bold tracking-[0.35em] text-primary">
              COACHING
            </span>
          </Link>

          <p className="mt-4 max-w-md font-[Tajawal] text-[13px] font-medium leading-relaxed text-[#64748B] sm:text-[14px]">
            منصة متكاملة لبناء برنامجك التدريبي والغذائي ومتابعة تقدمك وتحقيق أهدافك.
          </p>

          <div className="mt-5 flex items-center justify-center gap-5 text-[#0F172A]">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="transition-colors hover:text-primary"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 text-center md:mt-12 md:grid-cols-3 md:gap-6">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <div className="font-[Tajawal] text-[14px] font-extrabold text-[#0F172A]">
                {column.title}
              </div>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center font-[Tajawal] text-[12px] text-[#94A3B8]">
          © {new Date().getFullYear()} جميع الحقوق محفوظة لـ Hakim Coaching
        </p>
      </div>
    </footer>
  );
}
