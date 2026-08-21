# MAAKFIT — حالة المشروع الحالية

**الإصدار:** 2.1  
**التاريخ:** 2026-08-20  
**الحالة:** مرجع حي — يُحدَّث عند كل milestone  
**الجمهور:** موظفون، مطورون، أي أداة ذكاء اصطناعي

> اقرأ هذا الملف لمعرفة *أين وصلنا*. المعمارية في [`APP_ARCHITECTURE.md`](./APP_ARCHITECTURE.md). مراجعة UX في [`PROJECT_REPORT.md`](./PROJECT_REPORT.md).

---

## 1. الملخص التنفيذي

MAAKFIT **تطبيق رسمي معتمد** (منصة يومية عربية RTL)، وليست صفحة هبوط.

صفحة الهبوط `/coaching` طبقة تسويقية فقط. القيمة الحقيقية للعميل داخل `/app`: البرنامج، التغذية، التقدم، الملف، والدعم.

| الطبقة | المسار | الحالة |
|--------|--------|--------|
| بوابة المنتج | `/` | ✅ Quiz للزائر — session → `/app` |
| تسويق | `/coaching` | ✅ Landing مفصولة — لا قيمة يومية هنا |
| تقييم + إنشاء حساب | `/` و `/quiz` | ✅ نفس `QuizPage` + onboarding مدمج |
| التطبيق | `/app/*` | ✅ المنصة اليومية (الحقيقة للمنتج) |
| دخول | `/auth` | ✅ |
| قانوني / سياسات | `/privacy` · `/terms` · `/refund` · `/contact` | ✅ V1 — `policy-catalog` v1.0 |
| فوترة العضو | `/app/billing` | 🚧 في الكود — يحتاج QA + تطبيق migration |
| أدمن مدفوعات | `/admin/payments` | ✅ |
| صندوق الكوتش | `/admin/messages` | ✅ في الكود — يحتاج تحقق إنتاج |
| مسار `/onboarding` مستقل | — | ❌ غير موجود |

**الإنتاج:** https://hakimlemagicien.com  
**Supabase:** `ufgrbpakuemamggwypdh`  
**الفرع الحالي للعمل:** `feat/legal-pricing-billing-v1` (يُراجع مقابل `main`)

---

## 2. ماذا تغيّر عن الجيل السابق؟

| قبل (عقلية الموقع) | الآن (عقلية التطبيق) |
|---------------------|----------------------|
| `/` = صفحة هبوط تسويقية | `/` = بوابة المنتج (Quiz أو `/app`) |
| العميل «يزور موقعاً» | العميل «يدخل تطبيقه» |
| القيمة تُروى في Landing | القيمة تُعاش داخل `/app` |
| Landing جزء من المنتج | Landing قناة اكتساب فقط |

التوثيق السابق محفوظ في [`docs/v1/`](./v1/README.md) ولا يُستخدم لوصف المنتج الحالي.

---

## 3. ما تم إنجازه ويعمل في التطبيق

### الدخول والتحويل
- App-First: زائر بدون جلسة يرى Quiz على `/`
- جلسة صالحة → `/app` مباشرة (بدون وميض Landing أو Quiz)
- Landing على `/coaching` — CTAs نحو `/` فقط
- إنشاء الحساب داخل Quiz: بريد OTP → كلمة مرور → صورة → ترحيب → `/app`
- Checkout التحويل البنكي **legacy** — لا يُفتح بعد `reveal` في المسار الأمامي
- تسعير V1 رسمي: Essential / Premium / VIP — 3 أو 6 أشهر فقط (لا اشتراك شهري)
- موافقة checkout: `accept_checkout_policies` + نسخ إفصاح التجديد (`buildCheckoutDisclosure`)
- صفحات قانونية ثنائية اللغة (ar/en عبر `?lang=`) — محتوى من `src/lib/legal/policy-content.ts`
- `/contact` — دعم عام (حساب، فوترة، استرداد، خصوصية) منفصل عن دردشة الكوتش Premium/VIP
- `/app/billing` — عرض الاشتراك، إلغاء التجديد (`cancel_my_renewal`)، روابط السياسات

### هيكل `/app`
- صدفة المنصة: شريط علوي (قائمة + ملف / إشعارات + رسائل)، درج قائمة، شريط سفلي للموبايل
- الرئيسية: بطاقة هدف، لقطة اليوم، التمرين التالي، نصيحة الكوتش، اكتشف، ترقية للخطة المجانية
- التمارين: جدول أسبوعي، مشغّل تمرين داخل التطبيق (فيديو مربع، راحة، تسجيل مجموعات)
- التغذية: لوحة يومية + مكتبة وجبات MEAL-001–300 + ماء
- اكتشف: تغذية محتوى / CMS
- الملف: بطاقة عضو (هدف الكويز الحقيقي، عضوية، إنجازات) + رابط «الاشتراك والفوترة» → `/app/billing`
- الأدوات: حاسبة سعرات، مؤقت فترات
- الدعم: أسئلة شائعة + دردشة كوتش داخل التطبيق (صلاحية العضوية)
- الماء: تذكير وبطاقة داخل الصدفة — لا مسار `/app/water`

### بيانات وعضوية
- عضوية Free / Essential / Premium / VIP عبر `get_my_membership` (موسّع بحقول billing lifecycle)
- `get_my_billing` — لقطة فوترة للعضو (خطة، مدة، تجديد، إلغاء)
- Essential: برنامج + تتبع — **بدون** دردشة كوتش
- Premium/VIP: دردشة كوتش + متابعة (VIP أولوية أعلى — **ليس** 24/7)
- حساب المراجعة المؤسس يُعامل VIP داخل التطبيق
- هدف العميل على بطاقة البروفايل يُترجم من `goalId` في الكويز (مثل خسارة الدهون / تكبير المؤخرة)

### قانوني / خصوصية / دعم (V1)
- Migration: `20260820120000_legal_billing_privacy_v1.sql`
- جداول: `policy_acceptances`, `support_tickets`, `account_deletion_requests`, `audit_events`, `renewal_reminders`, `media_consents`
- RPCs: `accept_checkout_policies`, `accept_policy_version`, `create_support_ticket`, `cancel_my_renewal`, `get_my_billing`, `request_account_deletion`, `member_can_use_coach_chat`
- الكود: `src/lib/legal/*` — catalog، billing، policy content، support guards
- اختبار: `src/lib/legal/legal-pricing-v1.test.ts` ضمن `npm test`
- **TBD:** الكيان القانوني، القانون الحاكم، تاريخ السريان العلني — مذكورة صراحة في `policy-catalog.ts`

### بنية تحتية
- TanStack Start + React 19 + Vite + Vercel
- Supabase: auth، RLS، migrations، Edge Functions
- أداء إلزامي: [`v1/PERFORMANCE.md`](./v1/PERFORMANCE.md)

---

## 4. جزئي أو يحتاج تحقق

| المجال | الحالة |
|--------|--------|
| تخصيص البرنامج حسب هدف الكويز | ✅ محرّكات V2 (Phases 2–11) موصولة بحلقة العميل. الحالة: `CLIENT_LOOP_CLOSED_WITH_EXTERNAL_RELEASE_GATES`. **ليست** مفعّلة إنتاجياً. التقرير: [`TRAINING_ENGINE_V2_CLIENT_LOOP_INTEGRATION_CLOSURE_REPORT.md`](./TRAINING_ENGINE_V2_CLIENT_LOOP_INTEGRATION_CLOSURE_REPORT.md) |
| التغذية اليومية | 🚧 مكتبة كبيرة + لوحة؛ ليست خطة كوتش كاملة لكل عميل. عقد Training↔Nutrition: `PENDING_SHARED_CONTRACT` |
| التقدم `/app/progress` | ✅ ترقية Phase 11 على نفس المسار. بطاقة الهدف قد تبقى `INSUFFICIENT_DATA` حتى تُحفظ قرارات Phase 9 |
| دردشة الكوتش Realtime | ⚠️ في الكود — تحقق migration + RLS + Resend على الإنتاج |
| Checkout البنكي | ⚠️ legacy — قرار استخدام إنتاجي معلّق |
| Legal/Billing V1 على الإنتاج | ⚠️ migration + QA + قرار الكيان القانوني (TBD) |
| جلسة بدون إكمال onboarding | ⚠️ `/` يوجّه إلى `/app` دون فحص `get_my_onboarding_state` |
| Push notifications | 🚧 تذكير تدريب داخل التطبيق (Phase 11 overlay) — **لا** يوجد OS push |
| دفع إلكتروني (بطاقة/PSP) | 🚧 جاهزية عقد V1 — لا مزود دفع نهائي مفعّل |

---

## 5. User Flow المعتمد

### زائر جديد
```
/coaching (اختياري — تسويق فقط)
    → CTA → /
Quiz: gender → goals → … → contact → reveal
    → verifyEmail → password → avatar → /app
```

### عميل لديه جلسة
```
أي زيارة لـ /  →  /app
```

### عميل لديه حساب بدون جلسة
```
/  →  Quiz + «لديك حساب؟»  →  /auth  →  /app
```

---

## 6. نقاط الدخول في الكود

| الموضوع | الملف |
|---------|-------|
| بوابة `/` | `src/routes/index.tsx` |
| Landing | `src/routes/coaching.tsx` |
| Quiz المشترك | `src/routes/quiz.tsx` (`QuizPage`) |
| صدفة التطبيق | `src/routes/_platform/route.tsx` |
| الرئيسية | `src/routes/_platform/app/index.tsx` |
| الملف | `src/routes/_platform/app/profile.tsx` |
| شريط التنقل | `src/components/platform/layout/PlatformNav.tsx` |
| عضوية | `src/lib/platform/membership.ts` |
| تسعير V1 | `src/lib/pricing-presentation.ts` |
| قانوني / فوترة | `src/lib/legal/` · `src/routes/privacy.tsx` · `terms.tsx` · `refund.tsx` · `contact.tsx` |
| فوترة داخل التطبيق | `src/routes/_platform/app/billing.tsx` · `BillingSettings.tsx` |
| موافقة checkout | `src/components/checkout/CheckoutScreen.tsx` · `AgreementCheckbox.tsx` |

---

## 7. قواعد سريعة لأي AI

1. المنتج = `/app`. ليس `/coaching`.
2. لا تعدّل تصميم Landing أو Quiz أو الأدمن دون موافقة المالك.
3. `/quiz` يبقى للتوافق (روابط، OTP). لا تحذفه.
4. Onboarding داخل Quiz — لا تُنشئ `/onboarding`.
5. اللون التنفيذي للتطبيق: `#F97316`. الأخضر للحالات المكتملة الإيجابية فقط.
6. مصدر الحقيقة: GitHub `main` + Supabase `ufgrbpakuemamggwypdh`.

---

**آخر مراجعة:** 2026-08-20 — Legal/Pricing/Billing/Privacy V1 + تحديث التسعير الرسمي (Essential $87/$149 · Premium $147/$249 · VIP $397/$647).
