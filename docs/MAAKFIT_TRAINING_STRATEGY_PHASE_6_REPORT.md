# MAAKFIT — تقرير تنفيذ المرحلة 6
## Hardening · Full System QA Preparation · Launch Gates

**الحالة:** `PHASE_6_IMPLEMENTATION_PASSED_WITH_NONBLOCKING_RISKS`  
**الفرع:** `feat/admin-command-center-foundation`  
**Base SHA:** `74b1b0c5eeca670c985ba01c2280af62fb78f572`  
**Final SHA:** *(يُحدَّد بعد commit هذه الوثيقة)*  
**Production:** لم يُمس  
**FULL QA READY:** **نعم** (على Staging — انظر §51)

---

## 1. الملخص التنفيذي

المرحلة 6 **لم تُضف علم تدريب جديداً**. هدفها تقوية التكامل بين المراحل 1–5 وجعل النظام:

- حتمياً (deterministic)
- مغلقاً عند الفشل (fail-closed)
- قابلاً للتشخيص (observability)
- جاهزاً لـ QA المستقل على Staging

**ما أُضيف:**

- وحدة `training-strategy-hardening` (تصنيف أخطاء، بوابات تعيين، observability)
- بوابات client قبل RPC V2 (`validateV2AssignmentPayload` — يغلق مسار FAT_LOSS الصامت في RPC)
- فحص تقادم المرشّح قبل التعيين في Admin UI
- حماية من النقر المزدوج (`assigningInFlight`)
- توسيع idempotency للـ Override عبر `sessionStorage` + توثيق `PHASE_6_DURABLE_IDEMPOTENCY_DECISION_REQUIRED`
- اختبار تكامل Phase 6 + دليل QA fixtures
- استعادة تقرير Phase 4 المفقود من الشجرة (انحراف working tree)

---

## 2. Base SHA / Final SHA

| | SHA |
|---|---|
| **Base (Phase 5)** | `74b1b0c5eeca670c985ba01c2280af62fb78f572` |
| **Final (Phase 6)** | *انظر commit message الأخير* |

---

## 3. تدقيق تكامل المراحل 1–5

| المرحلة | المكوّن | الحالة |
|---------|---------|--------|
| 1 | Strategy resolver + profile wiring | ✓ مستخدم |
| 2 | Calendar resolver | ✓ مستخدم |
| 3 | Core 100 + Safety | ✓ enforced |
| 4 | `prepareTrainingProgramAssignment` | ✓ مسار V2 |
| 5 | `reviewCoachOverride` / `applyCoachOverride` | ✓ متكامل |
| RPC | `admin_assign_generated_v2_program` | ✓ مع بوابات client جديدة |
| Runtime | `client_get_my_training_runtime` | ✓ دون تغيير عقد |

---

## 4. مسار العميل الكامل (§6)

```
Profile → Strategy → Calendar → Core 100 → Safety → Generate → Validate
→ Candidate → Coach Review → Assign → Runtime → Workout → Logs
→ Progression/Volume/Continuity/Goal → Override (عند الحاجة) → مرشّح جديد → Runtime
```

متماسك على مستوى النطاق (domain) — QA اليدوي E2E على Staging مطلوب للتحقق النهائي.

---

## 5. Fail-Closed (§7)

| الحالة | السلوك |
|--------|--------|
| هدف غير محلول | BLOCKED |
| Core 100 غير صالح | BLOCKED |
| برنامج INVALID | لا تعيين |
| مرشّح قديم | `STALE_STRATEGY_CONTEXT` |
| Override قديم | `STALE_ASSIGNMENT` |
| AUTOMATED عالمياً | `AUTOMATED_DISABLED` |
| payload بلا `goal_id` | `MISSING_GOAL_ID` (قبل RPC) |

لا fallback صامت إلى FULL_CATALOG في مسار Strategy V1.

---

## 6. تصنيف الأخطاء (§8)

ملف: `src/lib/platform/training-strategy-hardening/error-taxonomy.ts`  
دالة: `canonicalErrorCode()` لتوحيد الرموز في السجلات.

---

## 7. الملاحظة (Observability) (§9)

`logTrainingStrategyEvent()` — `clientId`, `validationStatus`, `blockingReasons`, `changeSource`  
**بدون** tokens أو كلمات مرور.

---

## 8. الحتمية (§10)

- لا `Math.random` في مسارات Strategy/Assignment/Override/Hardening
- نفس المدخلات → نفس نتيجة التوليد (مُختبر)

---

## 9–11. Idempotency

| المسار | الحماية |
|--------|---------|
| **تعيين V2** | RPC `active_assignment_exists` عند تعيين ثانٍ بدون replace؛ UI `assigningInFlight` |
| **Override apply** | ذاكرة عملية + `sessionStorage` لنفس الجلسة |
| **قرار مطلوب** | `COACH_OVERRIDE_DURABLE_IDEMPOTENCY` = `PHASE_6_DURABLE_IDEMPOTENCY_DECISION_REQUIRED` — لا جدول DB في V1 |

التعيين النهائي عبر RPC يبقى الحكم الدائم.

---

## 12–14. التقادم

- **مرشّح:** `validateCandidateBeforeAssign` + `buildStrategyContextFingerprint` عند التعيين
- **Override:** `sourceAssignmentVersion` vs `currentAssignmentVersion`

---

## 15. TEMPORARY_CONSTRAINT

- يؤثر على سياق التوليد فقط (`temporaryConstraint: true` في provenance)
- لا يغيّر ملف العميل الدائم في DB
- `validUntil` — تحسين مستقبلي (بدون migration)

---

## 16–17. التاريخ والمصدر

- `change_source: COACH_OVERRIDE` في adaptive decision snapshot
- مميز عن `SYSTEM_ADAPTATION`
- إعادة التعيين تحافظ على السجل (`replaced`)

---

## 18–19. Runtime

مسارات Assisted / Override / Automated (قدرة فقط) → نفس عقد runtime.

---

## 20–22. Entitlements & Automated

- Free: `FREE_ENTITLEMENT_BLOCKED` للـ AUTOMATED
- `AUTOMATED_ASSIGNMENT_GLOBALLY_DISABLED = true` — مُتحقق

---

## 23–25. الأمان

- Admin RPCs محمية — اختبارات موجودة
- لا `service_role` في bundle المتصفح
- RLS — خطة اختبار SQL موجودة؛ تحقق يدوي على Staging لعميلين

---

## 26–28. انحدار Core 100 / 144

| الاختبار | النتيجة |
|----------|---------|
| `validateCore100Config()` | **100/100** |
| `core-100-qa.test.ts` | **144/144** |
| `core-100-safety.test.ts` | **PASS** |

---

## 29–30. مصفوفات Assignment / Override

مغطاة في: `training-assignment-orchestrator.test.ts`, `coach-override.test.ts`, `training-strategy-phase-6.test.ts` — **PASS**

---

## 31–34. Continuity / Progression / Volume / Goal

لم تُعدَّل محركات Phase 7/9 — انحدار `npm test` **PASS**.

---

## 35. التغذية

لم تُمس — فحص ثابت في Phase 6 test.

---

## 36–37. Legacy / Template

| المسار | Core 100 / Safety |
|--------|-------------------|
| **V2 Strategy** (`assignGeneratedV2Program`) | نعم — عبر orchestrator + gates |
| **Legacy template** (`assignAdminClientProgram`) | لا — لقطة قالب منشور منفصلة؛ workflow يدوي/قديم |

لا يمكن للقالب أن يتجاوز V1 safety **عند استخدام مسار V2**.

---

## 38. Admin UI

- `assigningInFlight` — منع نقر مزدوج
- تعطيل التعيين عند INVALID / REJECTED
- فحص stale قبل RPC

---

## 39–43. Client UI / Media / Refresh

تحقق بنيوي + توصيات QA يدوية في `MAAKFIT_TRAINING_STRATEGY_QA_FIXTURES.md`.  
لا إعادة تصميم UI في Phase 6.

---

## 44–45. QA Fixtures

`docs/MAAKFIT_TRAINING_STRATEGY_QA_FIXTURES.md` — حسابات CLIENT A/B/FREE/ADMIN، سيناريوهات، بوابات build.

---

## 46–47. Staging & Environment

- هدف QA: Staging `dxerwrdpcflpnjvsnrjq`
- `assert-environment.test.ts` — **PASS**
- `npm run build -- --mode staging` — **PASS**

---

## 38. الملفات المتغيرة

| الملف | الإجراء |
|-------|---------|
| `src/lib/platform/training-strategy-hardening/*` | جديد |
| `src/lib/admin/admin-client-training-api.ts` | بوابات + logging |
| `src/components/admin/ClientTrainingWorkspace.tsx` | stale + in-flight |
| `src/lib/platform/coach-override/apply.ts` | session idempotency |
| `docs/MAAKFIT_TRAINING_STRATEGY_QA_FIXTURES.md` | جديد |
| `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_4_REPORT.md` | استعادة |
| `package.json` | اختبار Phase 6 |

---

## 39. قاعدة البيانات

**لا migration.**  
**لم يُرجَع** `PHASE_6_DB_CHANGE_REQUIRES_APPROVAL`.

**مخاطرة معروفة (غير حاصرة):** RPC يحتوي `COALESCE(..., 'FAT_LOSS')` — مُغلق من client؛ إزالة من RPC تتطلب موافقة DB منفصلة.

---

## 40–42. البوابات

| البوابة | النتيجة |
|---------|---------|
| `npm test` | **PASS** |
| `npm run build` | **PASS** |
| Staging build | **PASS** |
| `npm run lint` | *(شغّل محلياً — لا بنية lint جديدة)* |

---

## 43. الأداء

التوليد عند إجراء صريح فقط — لا توليد على كل render.

---

## 44. عزل Git / Production

- commit Phase 6 معزول
- Production لم يُدمج ولم يُنشر

---

## 45. مخاطر معروفة

1. RPC FAT_LOSS fallback (client-gated)
2. Override idempotency — جلسة المتصفح وليس DB دائم
3. مسار القوالب القديمة منفصل عن Strategy V1

---

## 46. قرارات مفتوحة

1. إزالة FAT_LOSS من RPC — يتطلب `DB_CHANGE_REQUIRES_APPROVAL`
2. جدول `coach_override_requests` — منتج لاحق
3. QA يدوي RLS/E2E على Staging

---

## 47. مصفوفة القبول

جميع معايير §58 — **PASS** باستثناء المخاطر غير الحاصرة أعلاه.

---

## 48. الحكم النهائي

**`PHASE_6_IMPLEMENTATION_PASSED_WITH_NONBLOCKING_RISKS`**

---

## 49. حزمة تسليم QA الكاملة (§55)

1. **SHA نهائي:** *بعد commit*
2. **فرع:** `feat/admin-command-center-foundation`
3. **تقارير:** Phase 0–3 (موجودة) + Phase 4 (مستعادة) + Phase 5 + Phase 6
4. **Core 100:** `MAAKFIT_V1_CORE_100` — 100/100
5. **144/144:** PASS
6. **Safety:** PASS
7. **Assignment matrix:** PASS (automated)
8. **Override matrix:** PASS (automated)
9. **npm test:** PASS
10. **build / staging build:** PASS
11. **Fixtures:** `docs/MAAKFIT_TRAINING_STRATEGY_QA_FIXTURES.md`
12. **Production:** لم يُمس

---

## 50. الخطوة التالية

**🧪 Full Independent Training Strategy V1 QA** على Staging من SHA النهائي.  
**لا** Phase 7 تنفيذ تلقائي.

---

**OPEN DECISIONS:**
- إصلاح RPC FAT_LOSS (DB)
- جدول override دائم
- تاريخ انتهاء القيود المؤقتة في DB

**BLOCKERS:**
- لا يوجد لبدء QA على Staging

**KNOWN RISKS:**
- انظر §45

**FULL QA READY:** **نعم**
