import { Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_ROUTES, SITE_LAST_UPDATED } from "@/lib/site-legal";

type Section = { title: string; body: string[] };

export function LegalPageShell({
  title,
  description,
  sections,
}: {
  title: string;
  description: string;
  sections: Section[];
}) {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#FAFAFA] font-sans text-foreground">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <nav className="mb-6 flex flex-wrap gap-2 text-[12px] font-bold text-neutral-500">
          <Link to="/" className="hover:text-primary">
            الرئيسية
          </Link>
          <span>·</span>
          <Link to={LEGAL_ROUTES.privacy} className="hover:text-primary">
            الخصوصية
          </Link>
          <span>·</span>
          <Link to={LEGAL_ROUTES.terms} className="hover:text-primary">
            الشروط
          </Link>
          <span>·</span>
          <Link to={LEGAL_ROUTES.refund} className="hover:text-primary">
            الاسترجاع
          </Link>
        </nav>

        <h1 className="font-[Cairo] text-[28px] font-black leading-snug text-[#0F172A]">{title}</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">{description}</p>
        <p className="mt-2 text-[12px] font-bold text-neutral-400">آخر تحديث: {SITE_LAST_UPDATED}</p>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.12)]"
            >
              <h2 className="font-[Cairo] text-[17px] font-black text-[#0F172A]">{section.title}</h2>
              <div className="mt-3 space-y-2.5 text-[13.5px] leading-[1.75] text-neutral-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
