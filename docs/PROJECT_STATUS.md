# Hakim Coaching — Project Status

**الإصدار:** 1.2  
**التاريخ:** 2026-08-14  
**الحالة:** مرجع حي — يُحدَّث عند كل milestone  
**الجمهور:** موظفون، مطورون، Cloud Agents، أدوات AI

> **اقرأ هذا الملف أولاً** إذا أردت معرفة *أين وصلنا* دون قراءة 1000+ سطر من Master Documentation.

---

## 1. الملخص التنفيذي (30 ثانية)

| الطبقة | الحالة |
|--------|--------|
| **App-First Entry** (`/`) | ✅ **منفّذ** — Quiz مباشرة؛ session → `/app` |
| Marketing Landing (`/coaching`) | ✅ Landing منقولة كما هي — CTAs → `/` |
| Quiz (legacy route `/quiz`) | ✅ backward-compatible — `?step=` + resume |
| Onboarding (داخل Quiz) | ✅ verifyEmail → password → avatar → `/app` |
| Login entry في Quiz | ✅ «لديك حساب؟ تسجيل الدخول» → `/auth` |
| Checkout (تحويل بنكي) | ⚠️ **legacy** — لا يُفتح بعد `reveal` في المسار الأمامي |
| Platform `/app` | ✅ Phase 1+ — Home, Workout, Discover, Profile, Tools |
| `/onboarding` route | ❌ **غير موجود** |

**Branch التنفيذ:** `feature/app-first-entry` — **Needs Verification:** حالة Production بعد merge/deploy (راجع §9).

---

## 2. App-First Architecture (معتمد ومنفّذ)

```
hakimlemagicien.com/          = App-First Entry (Smart Gateway)
hakimlemagicien.com/coaching  = Landing Page التسويقية
hakimlemagicien.com/app/*     = المنصة (Auth required)
hakimlemagicien.com/quiz      = Legacy route (deep links, ?step=, OTP callbacks)
```

| الحالة عند `/` | السلوك |
|----------------|--------|
| **بدون Session** | Quiz/Evaluation مباشرة (`QuizPage` — نفس `/quiz`) + «لديك حساب؟ تسجيل الدخول» |
| **Session صالحة** | Redirect فوري إلى `/app` (`beforeLoad` — بدون flash Quiz) |
| **`?step=`** | مدعوم على `/` و`/quiz` |

**لا يوجد** route `/onboarding`.

---

## 3. User Flow الحالي (الحقيقة في الكود)

### A — زائر جديد (بدون Session)

```
/  (أو /quiz legacy)
    loading → gender → … → contact → congrats → reveal
        ▼  afterReveal() — دائماً
    verifyEmail → createPassword → profilePhoto → platformWelcome → /app
```

### B — عميل لديه Session

```
/  →  /app  (مباشرة)
```

### C — عميل لديه حساب لكن بدون Session

```
/  →  Quiz (نفس الزائر) + «لديك حساب؟ تسجيل الدخول» → /auth → /app
```

### D — من Landing التسويقية

```
/coaching  →  CTA → /
```

### E — Checkout legacy (لا يُفتح من reveal)

```
trainingType → pricing → payment → Admin → /auth → /app
(فقط: localStorage resume · ?step= · /quiz)
```

**خطوة contact:** `createLead()` + `createOnboardingDraft()` معاً.

---

## 4. Landing `/coaching` — CTAs

| المكوّن | الوجهة |
|---------|--------|
| `Hero.tsx` | `/` |
| `ProblemSection.tsx` | `/` |
| `HowItWorks.tsx` | `/` |
| `SuccessStories.tsx` | `/` |
| `PricingTransparency.tsx` | `/` |
| `FinalCTA.tsx` | `/` |
| `Header.tsx` (الرئيسية) | `/coaching` |

**Historical / Legacy:** قبل 2026-08-14 كانت Landing على `/` وCTAs → `/quiz`.

---

## 5. Quiz — خطوات وملاحظات

```
loading | gender | goals | … | contact | congrats | reveal
| verifyEmail | createPassword | profilePhoto | platformWelcome
| trainingType | pricing | payment  (legacy)
```

- **Progress:** `quiz-step-progress.ts` + `localStorage` (`hakim_quiz_progress_v1`) — **لا يعتمد على pathname**
- **Login entry:** `src/components/quiz/QuizLoginEntry.tsx` — أعلى `/` و`/quiz`
- **OTP email redirect:** ما زال `/quiz?step=createPassword` (legacy صالح)

---

## 6. Platform `/app`

(بدون تغيير — راجع v1.1 للتفاصيل)

| المسار | الحالة |
|--------|--------|
| `/app` | ✅ Home hub |
| `/app/program/workout` | ✅ Workout player |
| `/app/discover` | ✅ CMS |
| `/app/profile` | ✅ Account + avatar |
| `/app/nutrition/*` | 🚧 جزئي |
| `/app/progress` | 🚧 UX مبني — بيانات محلية |
| `/app/support` | ✅ FAQ + محادثة كوتش (Messaging V1 في الكود) |
| `/app/support/chat` | ✅ دردشة خاصة — **Needs Verification:** migration على production |
| `/admin/messages` | ✅ صندوق الكوتش — **Needs Verification:** RLS + Realtime + Resend |

---

## 7. نقاط الدخول في الكود

| الموضوع | الملف |
|---------|-------|
| App-First Gateway | `src/routes/index.tsx` |
| Marketing Landing | `src/routes/coaching.tsx` |
| Quiz (shared UI) | `export QuizPage` في `src/routes/quiz.tsx` |
| Quiz login entry | `src/components/quiz/QuizLoginEntry.tsx` |
| Platform shell | `src/routes/_platform/route.tsx` |

---

## 8. Build & Deploy

```bash
npm run dev
npm run build
```

- **CI smoke tests:** `/`, `/coaching`, `/quiz`, `/auth`
- **Production URL:** https://hakimlemagicien.com

---

## 9. Production Deployment

| البند | الحالة |
|-------|--------|
| Merge إلى `main` | **Needs Verification** — راجع PR/deploy logs |
| Vercel deploy | تلقائي عند push `main` |
| Smoke `/` | Quiz entry (ليس Landing) |
| Smoke `/coaching` | Landing |

---

## 10. للـ AI Agents — قواعد سريعة

1. **`/` = المنتج** — ليس Landing
2. **`/coaching` = Landing** — محمية بصرياً (لا إعادة تصميم دون موافقة)
3. **`/quiz` = legacy** — لا تحذف؛ deep links + OTP
4. **Onboarding داخل Quiz** — لا `/onboarding`
5. **Source of truth:** GitHub `main` + Supabase `ufgrbpakuemamggwypdh`

---

## 11. Needs Verification

| ID | السؤال |
|----|--------|
| D1 | Checkout legacy — استخدام إنتاجي؟ |
| D5 | Migrations على Supabase prod |
| D6 | `get_my_onboarding_state` — غير مستخدم في Frontend |
| **D7** | **Session + onboarding غير مكتمل** — `get_my_onboarding_state` موجود؛ Frontend يوجّه session → `/app` دون فحص — **لم يُعتمد business logic جديد** |
| **D8** | **Production post-deploy** — تحقق يدوي من `/`, `/coaching`, session redirect |

---

## 12. فهرس الوثائق

```
README.md → docs/PROJECT_STATUS.md → docs/PROJECT_HANDBOOK.md
→ docs/MASTER_PROJECT_DOCUMENTATION.md → AGENTS.md
```

---

**آخر مراجعة:** 2026-08-14 — App-First Entry Architecture
