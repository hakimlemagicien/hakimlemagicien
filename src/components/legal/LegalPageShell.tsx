import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Ban,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  Cookie,
  Copyright,
  CreditCard,
  Database,
  FileText,
  Gavel,
  HeartPulse,
  Mail,
  MonitorSmartphone,
  Package,
  RefreshCw,
  Scale,
  Send,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
  Workflow,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import {
  LEGAL_ROUTES,
  SITE_LAST_UPDATED,
  SITE_SUPPORT_EMAIL,
  SITE_WHATSAPP_URL,
} from "@/lib/site-legal";

type Section = { title: string; body: string[] };
type LegalKind = "privacy" | "terms" | "refund";

const ORANGE = "#FF6B00";
const TEXT = "#0F172A";

const PAGE_META: Record<
  LegalKind,
  { heroIcon: LucideIcon; accent: string; accentSoft: string; label: string }
> = {
  privacy: { heroIcon: ShieldCheck, accent: "#16A34A", accentSoft: "#F0FAF4", label: "الخصوصية والأمان" },
  terms: { heroIcon: Scale, accent: "#2563EB", accentSoft: "#EFF6FF", label: "الشروط والالتزام" },
  refund: { heroIcon: RefreshCw, accent: ORANGE, accentSoft: "#FFF6EE", label: "الاسترجاع والإلغاء" },
};

const SECTION_ICONS: Record<LegalKind, LucideIcon[]> = {
  privacy: [Building2, Database, Workflow, Scale, Share2, Clock3, Shield, UserCheck, Cookie, HeartPulse],
  terms: [FileText, Package, Send, CreditCard, ClipboardCheck, AlertTriangle, Sparkles, Copyright, Ban, Gavel],
  refund: [MonitorSmartphone, CalendarClock, XCircle, AlertTriangle, Mail, Wallet, Ban, ShieldCheck],
};

const NAV = [
  { kind: "privacy" as const, to: LEGAL_ROUTES.privacy, label: "سياسة الخصوصية" },
  { kind: "terms" as const, to: LEGAL_ROUTES.terms, label: "الشروط والأحكام" },
  { kind: "refund" as const, to: LEGAL_ROUTES.refund, label: "سياسة الاسترجاع" },
];

function SectionBody({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="mt-4 space-y-3 text-[13.5px] leading-[1.85] text-neutral-700">
      {paragraphs.map((paragraph) => {
        const isBullet = paragraph.startsWith("•");
        if (isBullet) {
          return (
            <div
              key={paragraph}
              className="flex items-start gap-2.5 rounded-xl bg-neutral-50/80 px-3 py-2.5"
            >
              <span
                className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: ORANGE }}
              />
              <span className="flex-1 text-start">{paragraph.slice(1).trim()}</span>
            </div>
          );
        }
        return (
          <p key={paragraph} className="text-start">
            {paragraph}
          </p>
        );
      })}
    </div>
  );
}

export function LegalPageShell({
  kind,
  title,
  description,
  sections,
}: {
  kind: LegalKind;
  title: string;
  description: string;
  sections: Section[];
}) {
  const meta = PAGE_META[kind];
  const HeroIcon = meta.heroIcon;
  const icons = SECTION_ICONS[kind];

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen font-[Tajawal,Cairo,sans-serif] text-foreground"
      style={{
        background:
          "linear-gradient(180deg, #F3EFE8 0%, #F7F5F2 28%, #FAF8F5 58%, #FFFFFF 100%)",
      }}
    >
      <Header />

      <main className="mx-auto max-w-3xl lg:max-w-4xl xl:max-w-5xl px-5 py-10 sm:px-8">
        {/* Breadcrumb — يقرأ من اليمين */}
        <nav className="mb-5 flex flex-wrap items-center justify-start gap-1.5 text-[11.5px] font-bold text-neutral-500">
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-neutral-600 shadow-sm">
            الصفحات القانونية
          </span>
          <span className="text-neutral-300" aria-hidden>
            /
          </span>
          <Link
            to="/"
            className="rounded-full px-2.5 py-1 transition hover:bg-white/70 hover:text-primary"
          >
            الرئيسية
          </Link>
        </nav>

        {/* Page tabs */}
        <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {NAV.map((item) => {
            const active = item.kind === kind;
            return (
              <Link
                key={item.kind}
                to={item.to}
                className="rounded-2xl border px-4 py-3 text-center text-[12.5px] font-black transition-all active:scale-[0.99]"
                style={{
                  background: active ? meta.accentSoft : "rgba(255,255,255,0.75)",
                  borderColor: active ? `${meta.accent}33` : "rgba(15,23,42,0.06)",
                  color: active ? TEXT : "#64748B",
                  boxShadow: active
                    ? `0 12px 28px -18px ${meta.accent}55`
                    : "0 4px 14px -12px rgba(15,23,42,0.08)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Hero */}
        <header
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-7"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #FFFBF7 55%, #FFF6EE 100%)",
            borderColor: "rgba(255,107,0,0.12)",
            boxShadow:
              "0 20px 50px -28px rgba(255,107,0,0.35), 0 8px 24px -16px rgba(15,23,42,0.1)",
          }}
        >
          <div
            className="pointer-events-none absolute -start-10 -top-10 h-36 w-36 rounded-full opacity-40 blur-3xl"
            style={{ background: meta.accent }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-1 items-start gap-4">
              <div
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
                style={{
                  background: `linear-gradient(145deg, ${meta.accent} 0%, ${ORANGE} 100%)`,
                  boxShadow: `0 14px 30px -14px ${meta.accent}88`,
                }}
              >
                <HeroIcon className="h-7 w-7 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold"
                  style={{ background: meta.accentSoft, color: meta.accent }}
                >
                  <Sparkles className="h-3 w-3" />
                  {meta.label}
                </div>
                <h1
                  className="mt-2 font-[Cairo] text-[26px] font-black leading-snug sm:text-[28px]"
                  style={{ color: TEXT }}
                >
                  {title}
                </h1>
                <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-600">{description}</p>
              </div>
            </div>
            <div
              className="shrink-0 self-start rounded-2xl border px-3 py-2 text-start text-[10.5px] font-bold text-neutral-500"
              style={{ background: "rgba(255,255,255,0.85)", borderColor: "rgba(15,23,42,0.06)" }}
            >
              <div className="text-[9.5px] font-extrabold text-neutral-400">آخر تحديث</div>
              <div className="mt-0.5 font-black text-neutral-700">{SITE_LAST_UPDATED}</div>
            </div>
          </div>
        </header>

        {/* Sections */}
        <div className="mt-8 space-y-4">
          {sections.map((section, index) => {
            const Icon = icons[index] ?? FileText;
            const sectionNum = section.title.split(".")[0]?.trim() ?? String(index + 1);
            const sectionTitle = section.title.includes(".")
              ? section.title.slice(section.title.indexOf(".") + 1).trim()
              : section.title;

            return (
              <section
                key={section.title}
                className="group rounded-3xl border bg-white/90 p-5 transition-all duration-300 hover:-translate-y-0.5 sm:p-6"
                style={{
                  borderColor: "rgba(15,23,42,0.06)",
                  boxShadow: "0 10px 30px -22px rgba(15,23,42,0.18)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(160deg, ${meta.accentSoft} 0%, #FFFFFF 100%)`,
                      border: `1px solid ${meta.accent}22`,
                      boxShadow: `0 8px 20px -14px ${meta.accent}44`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: meta.accent }} strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-start gap-2.5">
                      <span
                        className="rounded-lg px-2 py-0.5 text-[10px] font-black"
                        style={{ background: "#FFF6EE", color: ORANGE }}
                      >
                        {sectionNum}
                      </span>
                      <h2
                        className="font-[Cairo] text-[16.5px] font-black leading-snug sm:text-[17px]"
                        style={{ color: TEXT }}
                      >
                        {sectionTitle}
                      </h2>
                    </div>
                    <SectionBody paragraphs={section.body} />
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Support strip */}
        <div
          className="mt-8 flex flex-col items-stretch gap-3 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            borderColor: "rgba(255,255,255,0.08)",
            boxShadow: "0 18px 40px -24px rgba(15,23,42,0.55)",
          }}
        >
          <div className="text-start">
            <div className="font-[Cairo] text-[15px] font-black text-white">هل لديك سؤال قانوني؟</div>
            <p className="mt-1 text-[12px] leading-relaxed text-white/70">
              فريق الدعم جاهز للرد على استفساراتك المتعلقة بالخصوصية أو الشروط أو الاسترجاع.
            </p>
          </div>
          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
            <a
              href={`mailto:${SITE_SUPPORT_EMAIL}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black text-white transition active:scale-[0.98]"
              style={{ background: ORANGE, boxShadow: `0 12px 28px -14px ${ORANGE}aa` }}
            >
              <Mail className="h-4 w-4" />
              <span dir="ltr" className="text-start">
                {SITE_SUPPORT_EMAIL}
              </span>
            </a>
            <a
              href={SITE_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[12px] font-black text-white/90 transition hover:bg-white/10 active:scale-[0.98]"
              style={{ borderColor: "rgba(255,255,255,0.18)" }}
            >
              واتساب الدعم
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
