# عيب ظهور 37 قالبًا في Admin — Phase 10

**TASK:** ADMIN_37_TEMPLATE_VISIBILITY_DEFECT  
**STATUS:** PASS  
**التاريخ:** 2026-09-13  
**STAGING_CHANGED:** NO  
**PRODUCTION_CHANGED:** NO

---

## EXECUTIVE_SUMMARY_AR

الصفحة الحقيقية `/admin/programs` على `localhost:5173` كانت تتصل ببيئة خاطئة (Production عبر `.env`، وأحيانًا Staging بسبب تسرّب متغيرات في الـshell)، بينما استيراد Phase 9 نجح في **Local Supabase** (`127.0.0.1:54322` / API `54321`). لذلك ظهرت بطاقات قليلة شبيهة بـ Pilot/Legacy. بعد تشغيل Vite على Local (`--mode phase6` + بيئة نظيفة) ورفع حد القائمة إلى 50، عرضت الصفحة **Canonical V1 = 37/37** مع RPC يرجع 41 صفًا (37 كانوني + 4 نسخ غير كانونية).

---

## DEV_SERVER_ENVIRONMENT

| البند | القيمة |
|-------|--------|
| DEV_SERVER_URL | `http://127.0.0.1:5173` |
| قبل الإصلاح (default `npm run dev`) | `.env` → **PRODUCTION** `ufgrbpakuemamggwypdh` |
| سبب إضافي للفشل أثناء التحقيق | متغيرات `VITE_SUPABASE_*` من Staging كانت محمّلة في الـshell (من جلسة QA سابقة) فتطغى على ملفات `.env*` |
| بعد الإصلاح | `npm run dev:local` (`--mode phase6`) → Local `http://127.0.0.1:54321` |

## ACTUAL_DATABASE_USED_BY_ADMIN

| الحالة | قاعدة البيانات |
|--------|----------------|
| قبل | ليس Local Phase 9 — Production (أو Staging عند تسرّب env) |
| بعد | Local Supabase — نفس DB التي استُوردت إليها الـ37 |

---

## قبل الإصلاح

| المقياس | القيمة |
|---------|--------|
| DB_PROGRAM_TEMPLATE_COUNT_BEFORE (Local) | 41 (لم تُمس — كانت صحيحة) |
| DB_CANONICAL_COUNT_BEFORE (Local) | **37** |
| RPC_RESULT_COUNT_BEFORE (ما تقرأه الواجهة فعليًا) | قليل (بيئة غير Local) |
| FRONTEND_RENDERED_COUNT_BEFORE | ~Pilot/Legacy cards فقط |

## ROOT_CAUSE_AR

1. **انفصال البيئة:** `npm run dev` كان يقرأ Production من `.env`، بينما Phase 9 كتبت على Local Docker.  
2. **تسرّب env في الـshell:** `VITE_SUPABASE_URL` من Staging يبقى في العملية الأم ويطغى على ملفات env (أولوية Vite).  
3. **ليست فجوة استيراد في Local:** Local كان أصلًا 37/37.  
4. **تحسين عرض مكمّل:** حد الصفحة كان 25؛ رُفع إلى 50 مع عدّاد Canonical وفلتر «Canonical V1 فقط».

## WAS_PHASE9_IMPORT_IN_SAME_DB

**YES** — على Local. لكن واجهة Admin قبل الإصلاح **لم تكن** تقرأ نفس DB.

## FIX_TYPE

**MULTIPLE** — بيئة تشغيل (Frontend env) + تحسينات Frontend للعرض/العدادات.  
لا إعادة استيراد. لا تعديل RPC schema.

---

## بعد الإصلاح

| المقياس | القيمة |
|---------|--------|
| DB_CANONICAL_COUNT_AFTER | 37 |
| RPC_RESULT_COUNT_AFTER | 41 (حد 50؛ يشمل 4 نسخ `-v2-*` غير كانونية) |
| FRONTEND_CANONICAL_COUNT_AFTER | **37 / 37** |
| ADMIN_COUNTER_RESULT | PASS — KPI `Canonical V1` |
| ADMIN_FILTER_RESULT | PASS — الكل / بحث / مكان+مستوى |
| ADMIN_DETAIL_SAMPLE_RESULT | PASS — عينات Fat Loss / 06A / 06B / Glute |
| CANONICAL_37_VISIBLE | **YES** |
| BROKEN_REFERENCES | 0 (من QA السابق على نفس Local) |
| IMPORT_IDEMPOTENCY_RESULT | N/A — لم يُعاد الاستيراد |

---

## FILES_CHANGED

- `.env.local` — تنظيف توجيه Local (بدون Staging/Production client URL في النهاية)
- `package.json` — سكربت `dev:local` (`vite --mode phase6`)
- `src/lib/admin/admin-programs-api.ts` — `p_limit` حتى 50
- `src/components/admin/libraries/ProgramLibraryManager.tsx` — KPI Canonical + فلتر نطاق المكتبة
- `docs/phase10-visual-evidence/*` — أدلة الصفحة الحقيقية

## DB_WRITES

لا كتابة قوالب. (إعادة تعيين كلمة مرور مستخدم QA محلي فقط لأجل إثبات الشاشة.)

---

## WHAT_WAS_WRONG_AR

الادعاء السابق أن Admin List يعرض 37 كان مبنيًا على اختبارات/DB Local مباشرة، بينما المتصفح على `localhost:5173` كان يتصل بإنتاج (أو Staging). هذا انفصال بيئة وليس غياب الاستيراد.

## WHAT_WAS_FIXED_AR

- تشغيل Admin ضد Local الحقيقي.  
- توضيح Canonical 37 في العدادات وفصل النسخ غير الكانونية.  
- رفع حد الجلب لصفحة واحدةحدة تغطي الـ37+.  
- إضافة `npm run dev:local` لتفادي `npm run dev` الافتراضي المتصل بإنتاج.

## WHAT_I_SHOULD_REVIEW_AR

1. افتح `http://127.0.0.1:5173/admin/programs` بعد `npm run dev:local` في طرفية **نظيفة** (بدون `source .env.staging.local`).  
2. تأكد أن Network → `admin_list_program_templates` يذهب إلى `127.0.0.1:54321`.  
3. راجع قرار الإبقاء على `.env` الإنتاجي كافتراضي للمستودع أم تحويل التطوير المحلي دائمًا إلى Local.

## KNOWN_GAPS_AR

- 4 قوالب غير كانونية (`…-v2-*`) ما زالت في Local من اختبارات الإصدارات — تظهر فقط عند «الكل».  
- `npm run dev` بدون `--mode phase6` ما زال يعتمد على `.env` إن لم تُحمَّل overrides Local أخيرًا.  
- لم يُعاد التحقق من Staging في هذه المهمة (مقصود).

## NEXT_STEP_AR

إعادة تحقق Staging Admin بعد قبول الدليل المحلي. لا Production.

---

## دليل الإثبات

| ملف | المحتوى |
|-----|---------|
| `docs/phase10-visual-evidence/04-admin-programs-real-after-fix.png` | `/admin/programs` الحقيقي — 37/37 |
| `07–10-detail-*.png` | تفاصيل عينات |
| `11-admin-filters-gym-intermediate.png` | فلاتر |

## Completion Gate

- DB truth معروف ✅  
- RPC truth معروف ✅ (41 صف / Canonical filter → 37)  
- Frontend truth معروف ✅  
- السبب الجذري مثبت ✅  
- الصفحة الحقيقية تعرض 37 Canonical ✅  
- Staging/Production بدون تغيير ✅
