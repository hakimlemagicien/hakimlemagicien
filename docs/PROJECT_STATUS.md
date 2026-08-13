# Hakim Coaching — Project Status

**الإصدار:** 1.1  
**التاريخ:** 2026-08-13  
**الحالة:** مرجع حي — يُحدَّث عند كل milestone  
**الجمهور:** موظفون، مطورون، Cloud Agents، أدوات AI

> **اقرأ هذا الملف أولاً** إذا أردت معرفة *أين وصلنا* دون قراءة 1000+ سطر من Master Documentation.

---

## 1. الملخص التنفيذي (30 ثانية)

| الطبقة | الحالة |
|--------|--------|
| Landing + Quiz Funnel | ✅ يعمل — CTAs → `/quiz` |
| Onboarding (DB Phase A) | ✅ migrations + RPCs جاهزة |
| Onboarding (Frontend) | ✅ **مدمج داخل `/quiz`** — ليس `/onboarding` |
| Checkout (تحويل بنكي) | ⚠️ **legacy** — خطوات موجودة في Quiz؛ **لا تُستدعى** بعد `reveal` في المسار الأمامي |
| Admin Payments | ✅ يعمل |
| Platform `/app` | ✅ Phase 1+ — Home, Workout, Discover, Profile, Tools |
| Exercise Library (DB) | ✅ 320 تمرين + video asset strategy |
| Landing V2 / `/onboarding` route | ❌ **لم يُعتمد** — تراجع صريح من المالك |
| Paddle / Stripe | 🚧 معطّل في UI |

**Build:** `npm run build` ينجح على `main`.

---

## 2. أين وصلنا — Timeline قرارات

### ✅ معتمد ومنفّذ

1. **Phase A — Onboarding Database** (`47cb729`, `c8a497e`)
   - جداول: drafts, profiles, memberships, training_profiles
   - RPCs: `create_onboarding_draft`, `update_onboarding_draft`, `finalize_onboarding`
   - RLS + bucket `avatars`

2. **Quiz + Onboarding داخل `/quiz`** (`5b7cad7`, `0b3f3ff`)
   - خطوات: `verifyEmail` → `createPassword` → `profilePhoto` → `platformWelcome` → `/app`
   - API: `src/lib/quiz-onboarding-api.ts`
   - UI: `src/components/quiz/QuizOnboardingScreens.tsx`
   - OTP 8 أرقام + magic link

3. **Platform Member Experience** (`35ac9fd`, merge `5b0f037`)
   - Discover CMS، Profile، Tools (calories, timer)
   - Home hub، performance (OptimizedImage, skeletons)
   - Workout player experience

4. **Exercise Video Migration** (`7109704`, `e82ecaf`, `29ac3fd`)
   - Placeholder strategy + MD5 duplicate detection

5. **CI/CD** — deploy workflow + smoke tests على `/` و `/quiz`

### ❌ تجرب → تراجع (قرار المالك)

| المحاولة | السبب |
|----------|--------|
| Landing V2 + components/landing/* | تجاوز نطاق — إعادة تصميم غير معتمدة |
| تحديث نصوص الهوية (90 يوم، «ابدأ رحلتك») | Phase 1 نصوص — تراجع |
| تحويل CTAs → `/onboarding` | المسار غير موجود — تراجع |
| Frontend `/onboarding` مستقل (Phase B) | لم يُدمج في main — Onboarding يعمل عبر `/quiz` |

### ⏸️ موقوف حتى اعتماد منفصل

- تغيير نصوص Landing / Quiz
- Landing V2 أو إعادة ترتيب أقسام
- مسار `/onboarding` كمدخل رسمي بديل `/quiz`
- أي تعديل بصري على Hero / Header / Footer

---

## 3. User Flow الحالي (الحقيقة في الكود)

```
Landing (/)
    │
    ▼  [CTA: «ابدأ تقييمك المجاني» → /quiz]
    │
Quiz (/quiz)
    loading → gender → … → contact → congrats → reveal
        │
        ▼  afterReveal() — دائماً (src/routes/quiz.tsx)
    verifyEmail → createPassword → profilePhoto → platformWelcome → /app

[مسار Checkout — legacy فقط]
    trainingType → pricing → payment (تحويل بنكي)
        → Admin /admin/payments → Auth /auth → /app
    ⚠️ لا يُفتح من reveal في المسار الأمامي — فقط:
        • استئناف localStorage (quiz progress)
        • deep-link ?step=…
        • رجوع يدوي داخل Quiz
```

**خطوة contact:** تستدعي **معاً** `createLead()` (`lead-api.ts`) و `createOnboardingDraft()` (`quiz-onboarding-api.ts`).

**لا يوجد:** `GET /onboarding`  
**لا يوجد:** `/app/water` — الماء عبر `WaterProvider` (Sheet عالمي في Platform shell)

---

## 4. Landing Page — CTAs الحالية

| المكوّن | النص | الوجهة |
|---------|------|--------|
| `Hero.tsx` | ابدأ تقييمك المجاني | `/quiz` |
| `ProblemSection.tsx` | اكتشف الحل المناسب لك | `/quiz` |
| `HowItWorks.tsx` | متابعة التقييم | `/quiz` |
| `SuccessStories.tsx` | ابدأ رحلتك الآن | `/quiz` |
| `PricingTransparency.tsx` | فعّل برنامجك الآن | `/quiz` |
| `FinalCTA.tsx` | أنا جاهز للتغيير | `/quiz` |
| `Header.tsx` | — | `/auth` أو `/app` + WhatsApp |

**CTA التفعيل الرسمي (Handbook):** «فعّل برنامجك الآن» — ليس «اشترك الآن» / «ادفع الآن».

---

## 5. Quiz — خطوات (Step type)

```
loading | gender | goals | femaleGoals | age | measure | activity
| challenge | femaleChallenge | injuries | investment | bodyType
| femaleBodyType | trainingEnvironment | analysis | contact | congrats | reveal
| verifyEmail | createPassword | profilePhoto | platformWelcome
| trainingType | pricing | pricingDubai | offlinePackages | payment
```

**Progress UX:** 10 milestones — `src/lib/quiz-step-progress.ts`

**مصدران للأسعار (لا تخلط بينهما):**

| المصدر | الملف | الاستخدام |
|--------|-------|-----------|
| رسمي (CEO) | `src/lib/pricing-presentation.ts` | Free / Essential / Premium / VIP — 3 و6 أشهر |
| داخلي legacy | `PRICING_TIERS` داخل `quiz.tsx` | شاشات pricing/payment داخل Quiz فقط |

---

## 6. Platform `/app` — ما هو جاهز

| المسار | الحالة | ملاحظة |
|--------|--------|--------|
| `/app` | ✅ | Home hub — DailyMotivation, tasks, hero goal images |
| `/app/program/workout` | ✅ | Workout player + set logs |
| `/app/exercises` | ✅ | مكتبة تمارين (gated) |
| `/app/discover` | ✅ | CMS seed + categories |
| `/app/profile` | ✅ | Account center + avatar |
| `/app/tools/calories` | ✅ | حاسبة سعرات |
| `/app/tools/timer` | ✅ | Interval timer |
| `/app/nutrition` | 🚧 | Hub + sub-routes (محتوى جزئي) |
| `/app/nutrition/meal` | 🚧 | وجبة اليوم |
| `/app/nutrition/shopping` | 🚧 | قائمة تسوق |
| `/app/nutrition/progress` | 🚧 | تقدم التغذية |
| `/app/nutrition/alternatives` | 🚧 | بدائل وجبات |
| `/app/progress` | 🚧 | **UX dashboard مبني** — بيانات محلية/جزئية (`progress-storage.ts`) |
| `/app/support` | 🚧 | WhatsApp للـ Premium |
| `/app/studio` | 🔧 | Design lab (داخلي) |

**Shell:** `PlatformShell.tsx` — sidebar desktop + bottom nav mobile  
**Membership:** RPC `get_my_membership` عبر `fetchMembershipState()` في `membership.ts` + `useMembership.ts`  
**Tiers:** `visitor`, `free`, `essential`, `premium`, `vip`, `admin`

**الماء:** لا route — `WaterProvider` في `PlatformShell.tsx`

---

## 7. Database — Migrations (23 ملف)

### Onboarding (Phase A)
| Migration | المحتوى |
|-----------|---------|
| `20260711100000_onboarding_schema.sql` | Schema |
| `20260711101000_onboarding_free_membership_seed.sql` | Tiers seed |
| `20260711102000_onboarding_rpcs.sql` | RPCs |
| `20260711103000_onboarding_rls.sql` | RLS |
| `20260711104000_onboarding_avatar_storage.sql` | avatars bucket |

### أخرى مهمة
- Leads MVP + admin payment review
- Exercise library foundation + program templates
- Workout set logs
- Discover CMS
- Exercise video asset management

**Types:** `src/integrations/supabase/types.ts` — يجب مزامنته بعد migrations.

---

## 8. هيكل الكود — نقاط الدخول

| الموضوع | الملف |
|---------|-------|
| Landing page | `src/routes/index.tsx` |
| Quiz funnel | `src/routes/quiz.tsx` |
| Onboarding API | `src/lib/quiz-onboarding-api.ts` |
| Onboarding UI | `src/components/quiz/QuizOnboardingScreens.tsx` |
| Pricing catalog | `src/lib/pricing-presentation.ts` |
| Membership | `src/lib/platform/membership.ts` |
| Home engine | `src/lib/platform/home-hub.ts` |
| Routes (generated) | `src/routeTree.gen.ts` ⚠️ لا تعدّل |

---

## 9. Build & Deploy

```bash
npm run dev          # Vite dev server
npm run build        # vite build + verify-vercel-build.mjs
npm run optimize-images
```

- **Stack:** TanStack Start + React 19 + Vite 8 + Nitro (Vercel preset)
- **CI:** `.github/workflows/deploy.yml` — push `main` → Vercel prod + smoke test
- **Performance:** إلزامي — `docs/PERFORMANCE.md`, Lighthouse ≥ 90

---

## 10. خارطة الطريق — الأولويات

| # | الأولوية | الحالة |
|---|----------|--------|
| 1 | التحقق من RPC `get_my_membership` في الإنتاج (Needs Verification D5) | 🚧 |
| 2 | برنامج تدريب حقيقي من مكتبة التمارين | 🚧 جزئي |
| 3 | `/onboarding` route مستقل (اختياري — قرار معماري) | ❌ |
| 4 | تحديث نصوص الهوية (بدون تصميم) | ⏸️ بانتظار اعتماد |
| 5 | Paddle / دفع فوري | ❌ |
| 6 | In-app Coach Chat | ❌ |

---

## 11. للـ AI Agents — قواعد سريعة

1. **Source of truth:** GitHub `main` + Supabase `ufgrbpakuemamggwypdh`
2. **لا تعدّل:** Landing/Quiz/Admin إلا بطلب صريح من المالك
3. **لا force-push** على `main`
4. **`npm run build`** قبل اعتبار المهمة مكتملة
5. **Landing محمية** — DS1 في Handbook: لا تغيير هوية دون موافقة
6. **Onboarding موجود داخل Quiz** — لا تفترض `/onboarding` route
7. **Commit** — فقط عند طلب صريح

---

## 12. فهرس الوثائق

```
README.md                          ← نقطة الدخول
docs/PROJECT_STATUS.md             ← هذا الملف (حالة حية)
docs/PROJECT_HANDBOOK.md           ← دستور الشركة
docs/MASTER_PROJECT_DOCUMENTATION.md ← مرجع تقني شامل
docs/EMPLOYEE_MANUAL.md            ← دليل الموظف
AGENTS.md                          ← قواعد AI/CI
docs/PERFORMANCE.md                ← معايير الأداء
```

---

## 13. Needs Verification (غير مؤكد — لا تُذكر كحقائق)

| ID | السؤال | لماذا غير مؤكد |
|----|--------|----------------|
| D1 | هل مسار Checkout legacy ما زال يُستخدم في الإنتاج؟ | الكود الأمامي يتخطاه بعد `reveal` — لا بيانات استخدام |
| D2 | قواعد العمل لـ `createLead` + `createOnboardingDraft` معاً عند contact | كلاهما يُستدعى في الكود — الغرض التجاري غير موثّق |
| D3 | هل Lovable ما زال في سير العمل اليومي؟ | `vite.config.ts` الحالي **لا** يستخدم `@lovable.dev/vite-tanstack-config` |
| D4 | تغييرات `Hero.tsx` غير الملتزَمة في git | **Needs Verification** — راجع `git status` قبل الاعتماد (قد تكون نظيفة) |
| D5 | هل كل الـ 23 migration مُطبَّقة على Supabase الإنتاج؟ | يتطلب فحص Dashboard — غير مؤكد من الكود المحلي |
| D6 | هل RPC `get_my_onboarding_state` مستخدم في Frontend؟ | موجود في `types.ts` فقط — **لا استدعاء** في `src/` |

---

**آخر مراجعة:** 2026-08-13 — بعد تصحيحات C1–C10 (Documentation Verification)
