# MAAKFIT — معمارية المنتج الحالية

**الإصدار:** 2.1  
**التاريخ:** 2026-08-20  
**الغرض:** تعريف طبقات المنتج حتى لا يخلط أي إنسان أو ذكاء اصطناعي بين التسويق والتطبيق.

---

## 1. القرار المعماري

المنتج الرسمي هو **تطبيق الأعضاء** على `/app`.

صفحة الهبوط `/coaching` قناة تسويق واكتساب فقط. لا تخزّن قيمة العميل، لا برنامجه، لا تغذيته، ولا متابعته. العميل لا «يستخدم» Landing بعد التحويل.

```
اكتساب          تحويل                 قيمة حقيقية
─────────       ────────────          ─────────────────
/coaching  →    /  Quiz + حساب   →    /app  التطبيق اليومي
تسويق           تقييم + عضوية         البرنامج · التغذية · التقدم · الدعم
```

**ممنوع:** بناء ميزة يومية داخل `/coaching`، أو معاملة Landing كواجهة المنتج.

---

## 2. ثلاث عوالم منفصلة

| العالم | المسار | الجمهور | ماذا يفعل؟ | ماذا لا يفعل؟ |
|--------|--------|---------|------------|----------------|
| **تسويق** | `/coaching` | زائر لم يسجّل | ثقة، قصة الكوتش، CTA إلى `/` | لا جلسة تدريب، لا وجبات، لا ملف |
| **تحويل** | `/` · `/quiz` · `/auth` | زائر أو حساب جديد | تحليل شخصي، هدف، إنشاء عضوية | ليست المنصة اليومية |
| **قانوني / دعم عام** | `/privacy` · `/terms` · `/refund` · `/contact` | أي زائر أو عضو | سياسات، موافقات، تذاكر دعم عام | ليست دردشة الكوتش |
| **تطبيق** | `/app/*` | عضو مسجّل | كل القيمة المتعاقد عليها | لا تعيد رواية صفحة الهبوط |

`/quiz` نسخة توافق لنفس `QuizPage` المستخدم على `/` (روابط قديمة، `?step=`، رجوع OTP).

---

## 3. خريطة المسارات

```
hakimlemagicien.com/
├── /                 بوابة ذكية
│                      بدون جلسة → Quiz
│                      مع جلسة    → /app
├── /coaching         Landing تسويقية (تصميم محمي)
├── /quiz             نفس Quiz (legacy)
├── /auth             تسجيل دخول / كلمة مرور
├── /privacy          سياسة الخصوصية (ar/en ?lang=)
├── /terms            الشروط والأحكام
├── /refund           الاسترداد والإلغاء
├── /contact          تواصل ودعم عام (حساب · فوترة · خصوصية)
├── /pricing          redirect → /coaching#pricing
├── /app              التطبيق (يتطلب جلسة)
│   ├── /             الرئيسية
│   ├── /program/workout          تمارين اليوم + المشغّل
│   ├── /program/workout/exercise تمرين مفرد
│   ├── /nutrition                لوحة التغذية
│   ├── /nutrition/meal           وجبة
│   ├── /nutrition/shopping       تسوق
│   ├── /nutrition/progress       تقدم غذائي
│   ├── /nutrition/alternatives   بدائل
│   ├── /discover                 محتوى اكتشف
│   ├── /exercises                مكتبة التمارين
│   ├── /progress                 سجل التقدم
│   ├── /profile                  مركز العميل
│   ├── /billing                  الاشتراك والفوترة
│   ├── /tools/calories           حاسبة
│   ├── /tools/timer              مؤقت
│   ├── /support                  دعم + FAQ
│   ├── /support/chat             دردشة الكوتش (Premium/VIP)
│   ├── /achievements             إنجازات
│   └── /studio                   مسار خاص (بدون شريط سفلي كامل)
├── /admin/payments   مراجعة إيصالات
└── /admin/messages   صندوق رسائل الكوتش
```

التحقق من الجلسة لتطبيق `/app`: `src/routes/_platform/route.tsx` عبر `getSession()`.

---

## 4. معمارية الواجهة داخل `/app`

```
PlatformShell
  MenuDrawer (إعدادات / لغة / مظهر / دعم / خروج)
  Sidebar (سطح المكتب)
  main
    صفحة المسار
  شريط سفلي (موبايل): تماريني · تغذيتي · الرئيسية · اكتشف · الأدوات
  overlays مشتركة: ترقية العضوية · الماء · حاسبة السعرات · تذكير الماء
```

رأس الشاشات (RTL):

- اليمين: القائمة ثم صورة الملف
- اليسار: الجرس ثم الرسائل

الملفات:

- الصدفة: `src/components/platform/layout/PlatformShell.tsx`
- التنقل: `src/components/platform/layout/PlatformNav.tsx`
- الرأس: `src/components/platform/shared/PlatformHeaderActions.tsx`

---

## 5. طبقات التقنية

```
المتصفح (RTL, عربي)
    │
    ▼
TanStack Start / React 19 / Vite
    │  routes/  components/platform  lib/platform  hooks/
    ▼
Supabase
    Auth · Postgres + RLS · Storage (avatars, videos, meal images)
    RPCs: membership, billing, legal/consent, onboarding, admin
    Edge Functions: قبول دفع، إيميل، إشعارات
    Realtime: محادثات الكوتش (عند تفعيلها على المشروع)
    │
    ▼
Vercel (إنتاج) + GitHub main
```

| المجلد | الدور |
|--------|--------|
| `src/routes/` | المسارات فقط — لا منطق أعمال ثقيل |
| `src/components/platform/` | واجهة التطبيق |
| `src/components/` (جذر) | مكوّنات Landing المحمية |
| `src/lib/platform/` | منطق التطبيق: عضوية، وجبات، تمارين، بروفايل |
| `src/lib/legal/` | عقد V1: سياسات، فوترة، موافقات checkout، دعم عام |
| `src/lib/pricing-presentation.ts` | catalog التسعير الرسمي (Essential/Premium/VIP · 3/6 أشهر) |
| `src/integrations/supabase/` | العميل والأنواع |
| `supabase/migrations/` | مصدر حقيقة القاعدة |

---

## 6. بيانات العميل (مصدر القيمة)

ما يحدّد تجربة العضو داخل التطبيق — وليس نصوص Landing:

| البيان | المصدر | يظهر في |
|--------|--------|---------|
| الهدف | `training_profiles.answers.goalId` (اختيار الكويز) | بطاقة البروفايل، الهيرو |
| الجنس والقياسات | إجابات الكويز / الملف | التغذية، الحاسبة |
| العضوية | `get_my_membership` · `get_my_billing` | البوابات، بطاقة العضوية، `/app/billing` |
| الموافقات القانونية | `policy_acceptances` + RPCs | checkout، سياسات، audit |
| تذاكر الدعم العام | `support_tickets` | `/contact` — منفصل عن coaching chat |
| النشاط اليومي | تخزين محلي + لقطات المنصة | الرئيسية، الماء، السلسلة |
| الوجبات | مكتبة `meal_library` + خطة اليوم | `/app/nutrition` |
| التمارين | مكتبة التمارين + جدول الأسبوع | `/app/program/workout` |
| دردشة الكوتش | جداول coaching messaging + `member_can_use_coach_chat` | `/app/support/chat` — Premium/VIP فقط |

ترجمة الهدف: `resolveClientGoalLabel()` في `src/lib/platform/profile-experience.ts` — يجب أن تطابق تسمية الكويز لا فئات `cut/bulk` المختصرة.

---

## 7. بوابات العضوية

التطبيق يفتح للعضو المجاني بتجربة حقيقية محدودة، لا بجدار فارغ.

| القدرة | Free | مدفوع (حسب الباقة) |
|--------|------|---------------------|
| دخول `/app` | نعم | نعم |
| محتوى اكتشف المجاني | نعم | نعم |
| شريحة من التمرين/الوجبات | معاينة | البرنامج الكامل |
| دردشة الكوتش | لا (CTA ترقية) | Premium/VIP فقط (`member_can_use_coach_chat`) |
| دعم عام (فوترة · حساب · خصوصية) | نعم — `/contact` | نعم — `/contact` |
| إدارة الاشتراك / إلغاء التجديد | `/app/billing` | `/app/billing` |
| مراجعات وتعديل برنامج | لا | Premium/VIP حسب الباقة |

الترقية من داخل التطبيق (`MembershipUpgradeSheet`) — ليست من صفحة الهبوط.

---

## 8. حدود الحماية

لا تُعدَّل دون موافقة المالك:

1. تصميم `/coaching` ومكوّنات `src/components/Hero.tsx` وما حولها
2. واجهة Quiz البصرية
3. تدفقات الأدمن

يُسمح بتحسين `/app` وتجربة العضو اليومية وفق معايير الأداء والجودة.

---

## 9. كيف يفكر الـ AI في المهمة؟

قبل أي تعديل اسأل:

1. هل هذه الميزة يعيشها العميل **يومياً داخل `/app`**؟ إن نعم فهي المنتج.
2. هل هي فقط لإقناع زائر بالبدء؟ إن نعم فهي `/coaching` أو CTA نحو `/`.
3. هل تخلط لغة تسويقية داخل شاشات التطبيق؟ تجنّب ذلك — التطبيق يتكلم كمنصة شخصية («تماريني»، «هدفك»، «عضويتك»).

---

## 10. طبقة Legal / Billing V1

```
Quiz checkout / upgrade
    → buildCheckoutDisclosure (3|6 months · Essential/Premium/VIP)
    → AgreementCheckbox + accept_checkout_policies RPC
    → memberships billing columns + policy_acceptances audit

Member self-service
    → /app/billing (get_my_billing · cancel_my_renewal)
    → links to /privacy · /terms · /refund

General support (all tiers)
    → /contact (create_support_ticket RPC)
    ≠ /app/support/chat (Premium/VIP only)
```

| قرار V1 | التفاصيل |
|---------|----------|
| مدد مدفوعة | 3 أو 6 أشهر فقط — لا اشتراك شهري |
| Essential | برنامج + تتبع — **بدون** coaching chat |
| Premium/VIP | coaching chat + متابعة (VIP أولوية — **ليس** 24/7) |
| كيان قانوني | **TBD** في `policy-catalog.ts` — لا claims قبل اعتماد CEO |
| PSP | جاهزية عقد — لا مزود دفع نهائي مفعّل في V1 |

---

**مرجع الحالة:** [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)  
**مراجعة الجودة:** [`PROJECT_REPORT.md`](./PROJECT_REPORT.md)
