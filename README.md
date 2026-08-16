# Hakim Coaching Platform

منصة عربية (RTL) — **App-First:** `/` = Quiz/Evaluation، `/coaching` = Landing، `/app` = المنصة.

**الإنتاج:** [hakimlemagicien.com](https://hakimlemagicien.com)  
**Supabase:** `ufgrbpakuemamggwypdh`  
**المستودع:** GitHub `main`

---

## ابدأ من هنا

| الجمهور | الوثيقة | الغرض |
|---------|---------|--------|
| **موظف / مؤسس** | [`docs/PROJECT_HANDBOOK.md`](docs/PROJECT_HANDBOOK.md) | دستور الشركة — قرارات استراتيجية |
| **مطور / AI Agent** | [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | **أين وصلنا الآن** — حالة محدّثة |
| **مهندس** | [`docs/MASTER_PROJECT_DOCUMENTATION.md`](docs/MASTER_PROJECT_DOCUMENTATION.md) | مرجع تقني شامل |
| **موظف تشغيل** | [`docs/EMPLOYEE_MANUAL.md`](docs/EMPLOYEE_MANUAL.md) | قواعد العمل الداخلية |
| **AI / CI** | [`AGENTS.md`](AGENTS.md) | قواعد Git، Build، Performance |

> **قاعدة:** عند التعارض — الدستور يحكم القرارات الإدارية؛ Master Doc + PROJECT_STATUS يحكمان الحقائق التقنية.

---

## هيكل المشروع (مختصر)

```
src/
├── routes/           # TanStack Router — /, /coaching, /quiz, Auth, /app/*
├── components/       # landing · quiz · platform · checkout · ui
├── lib/              # business logic + platform/*
├── hooks/            # useMembership, useWorkoutPlayer, …
└── integrations/supabase/

supabase/
├── migrations/       # Schema, RLS, RPCs (مصدر الحقيقة)
└── functions/        # Edge Functions (admin, notifications)

docs/                 # وثائق رسمية + تقارير تسليم
scripts/              # build verify, exercise video migration, …
```

---

## مسارات رئيسية

| المسار | الوظيفة |
|--------|---------|
| `/` | **App-First Entry** — Quiz (session → `/app`) |
| `/coaching` | Landing Page التسويقية (CTAs → `/`) |
| `/quiz` | فانل تحليل + Onboarding (email, password, avatar)؛ Checkout legacy (لا يُفتح بعد reveal في المسار الأمامي) |
| `/auth` | تسجيل دخول / كلمة مرور |
| `/app` | منصة الأعضاء (Home, Program, Discover, Profile, Tools, …) |
| `/admin/payments` | مراجعة مدفوعات (أدمن) |

**غير موجود:** `/onboarding` كمسار مستقل — Onboarding مدمج داخل `/quiz`.

---

## أوامر التطوير

```bash
npm run dev      # تطوير محلي (Vite)
npm run build    # بناء إنتاج + verify-vercel-build
npm run lint     # ESLint
```

---

## تقارير التسليم (docs/)

| التقرير | الموضوع |
|---------|---------|
| [`PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | **حالة المشروع الحالية** |
| [`PERFORMANCE.md`](docs/PERFORMANCE.md) | معايير الأداء الإلزامية |
| [`EMAIL_VERIFICATION_UX.md`](docs/EMAIL_VERIFICATION_UX.md) | OTP + magic link |
| [`PLATFORM_QA_HANDOFF.md`](docs/PLATFORM_QA_HANDOFF.md) | QA المنصة |
| [`DISCOVER_REPORT.md`](docs/DISCOVER_REPORT.md) | Discover CMS |
| [`PROFILE_REPORT.md`](docs/PROFILE_REPORT.md) | Profile |
| [`EXERCISE_VIDEO_ASSET_MANAGEMENT.md`](docs/EXERCISE_VIDEO_ASSET_MANAGEMENT.md) | استراتيجية فيديو التمارين |

---

**آخر تحديث للتوثيق:** 2026-08-16 (Coaching Messaging V1 — Needs Verification على production)
