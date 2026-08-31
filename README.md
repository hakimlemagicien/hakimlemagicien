# MAAKFIT Platform

تطبيق عربي (RTL) — **المنتج = `/app`**. صفحة `/coaching` تسويق فقط. `/` = Quiz للزائر أو تحويل للجلسة إلى التطبيق.

**الإنتاج:** [hakimlemagicien.com](https://hakimlemagicien.com)  
**PRODUCTION Supabase:** `ufgrbpakuemamggwypdh`  
**STAGING Supabase:** `dxerwrdpcflpnjvsnrjq` (`hakim-coaching-staging`) — انظر [`docs/ENVIRONMENTS.md`](docs/ENVIRONMENTS.md)  
**المستودع:** GitHub `main`

---

## ابدأ من هنا

| الجمهور | الوثيقة | الغرض |
|---------|---------|--------|
| **أي AI / مطور** | [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | أين وصلنا الآن |
| **معمارية** | [`docs/APP_ARCHITECTURE.md`](docs/APP_ARCHITECTURE.md) | فصل التطبيق عن صفحة الهبوط |
| **مراجعة UX** | [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) | تقرير المشروع لتحسين جودة المستخدم |
| **فهرس التوثيق** | [`docs/README.md`](docs/README.md) | خريطة كل الملفات |
| **دستور الشركة** | [`docs/v1/PROJECT_HANDBOOK.md`](docs/v1/PROJECT_HANDBOOK.md) | قرارات إدارية (أرشيف ساري) |
| **AI / CI** | [`AGENTS.md`](AGENTS.md) | قواعد Git، Build، المناطق المحمية |

> **قاعدة:** عند التعارض — الدستور يحكم القرارات الإدارية؛ `PROJECT_STATUS` + `APP_ARCHITECTURE` + الكود تحكم الحقيقة التقنية الحالية. أرشيف `docs/v1` تاريخي.

---

## هيكل المشروع (مختصر)

```
src/
├── routes/           # TanStack Router — /, /coaching, /quiz, Auth, /app/*
├── components/       # landing · quiz · platform · checkout · ui
├── lib/              # business logic + platform/* + legal/*
├── hooks/            # useMembership, useWorkoutPlayer, …
└── integrations/supabase/

supabase/
├── migrations/       # Schema, RLS, RPCs (مصدر الحقيقة)
└── functions/        # Edge Functions (admin, notifications)

docs/                 # توثيق الجيل الحالي + أرشيف v1
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
| `/privacy` · `/terms` · `/refund` | سياسات V1 (ar/en عبر `?lang=`) |
| `/contact` | تواصل ودعم عام (حساب · فوترة · خصوصية) |
| `/app` | منصة الأعضاء (Home, Program, Nutrition, Profile, Billing, Tools, …) |
| `/admin/payments` | مراجعة مدفوعات (أدمن) |

**غير موجود:** `/onboarding` كمسار مستقل — Onboarding مدمج داخل `/quiz`.

---

## أوامر التطوير

```bash
npm run dev      # تطوير محلي (Vite)
npm run build    # بناء إنتاج + verify-vercel-build
npm run lint     # ESLint
npm test         # unit tests (meal-library, coach-chat, coaching-messaging, legal-pricing-v1)
```

---

## التوثيق الحالي (docs/)

| الملف | الموضوع |
|-------|---------|
| [`PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | حالة المشروع الحية |
| [`APP_ARCHITECTURE.md`](docs/APP_ARCHITECTURE.md) | معمارية التطبيق مقابل التسويق |
| [`PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) | تقرير مراجعة UX |
| [`v1/PERFORMANCE.md`](docs/v1/PERFORMANCE.md) | معايير الأداء الإلزامية |

**Legal/Billing V1 (2026-08-20):** `src/lib/legal/` · migration `20260820120000_legal_billing_privacy_v1.sql` · `/app/billing`

تقارير الميزات القديمة: [`docs/v1/`](docs/v1/README.md)

---

**آخر تحديث للتوثيق:** 2026-08-20 — Legal/Pricing/Billing/Privacy V1 + تسعير رسمي (Essential/Premium/VIP · 3/6 أشهر).
