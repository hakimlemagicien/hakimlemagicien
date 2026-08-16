import { SUPPORT_FAQS, type SupportFaqItem } from "@/lib/platform/support-faq";
import type { CoachTriageKind } from "@/lib/platform/coach-chat";

const MEAL_TERMS = ["وجبه", "وجبات", "اكل", "طبق", "بعد التمرين", "بروتين", "رز", "دجاج", "صوره وجبه"];
const PROGRAM_TERMS = [
  "وزن",
  "اوزان",
  "كيلو",
  "ضغط",
  "سكوات",
  "تكرار",
  "عدات",
  "ارفع",
  "نرفع",
  "نقص",
  "زيد",
  "التمرين",
  "الحصه",
];

export type CoachTriageResult =
  | {
      kind: "faq";
      faq: SupportFaqItem;
      suggestedText: string;
    }
  | {
      kind: Exclude<CoachTriageKind, "faq">;
      suggestedText: string;
    };

export function normalizeChatText(value: string) {
  return value
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokens(value: string) {
  return normalizeChatText(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function hasTerm(haystack: string, terms: string[]) {
  const normalized = normalizeChatText(haystack);
  return terms.some((term) => normalized.includes(normalizeChatText(term)));
}

function faqScore(text: string, faq: SupportFaqItem) {
  const query = new Set(tokens(text));
  if (query.size === 0) return 0;
  const corpus = tokens(`${faq.question} ${faq.keywords.join(" ")}`);
  let hits = 0;
  for (const token of corpus) {
    if (query.has(token)) hits += 1;
  }
  for (const keyword of faq.keywords) {
    if (normalizeChatText(text).includes(normalizeChatText(keyword))) hits += 2;
  }
  return hits;
}

const DRAFTS: Record<Exclude<CoachTriageKind, "faq">, string> = {
  meal_photo: "نعم، الوجبة مناسبة بعد التمرين: بروتين مع كارب وخضار. حافظ على نفس التوازن، وزيد الماء.",
  program_adjust: "تمام، نقدر نرفع الحمل تدريجياً في الحصة القادمة مع الإبقاء على التكنيك أولاً.",
  coach_needed: "وصلتني، راح أراجعها وأرد عليك بالتفصيل خلال ساعة.",
};

export function triageMemberMessage(input: { text: string; hasImage?: boolean }): CoachTriageResult {
  const text = input.text.trim();
  if (input.hasImage || hasTerm(text, MEAL_TERMS)) {
    return { kind: "meal_photo", suggestedText: DRAFTS.meal_photo };
  }
  if (hasTerm(text, PROGRAM_TERMS)) {
    return { kind: "program_adjust", suggestedText: DRAFTS.program_adjust };
  }

  let best: { faq: SupportFaqItem; score: number } | null = null;
  for (const faq of SUPPORT_FAQS) {
    const score = faqScore(text, faq);
    if (!best || score > best.score) best = { faq, score };
  }
  if (best && best.score >= 3) {
    return { kind: "faq", faq: best.faq, suggestedText: best.faq.answer };
  }

  return { kind: "coach_needed", suggestedText: DRAFTS.coach_needed };
}

export function statusCopyForTriage(kind: Exclude<CoachTriageKind, "faq">) {
  if (kind === "meal_photo") return "صورة الوجبة وصلت. جهّزت مسودة للكوتش — يرد بعد الاعتماد.";
  if (kind === "program_adjust") return "طلب تعديل التمرين وصل. المسودة جاهزة، والكوتش يعتمدها قبل الإرسال.";
  return "رسالتك وصلت للكوتش. جهّزت مسودة ويرد بعد الاعتماد.";
}
