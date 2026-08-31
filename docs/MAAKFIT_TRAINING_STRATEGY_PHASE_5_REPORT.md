# MAAKFIT — تقرير تنفيذ المرحلة 5
## Coach Overrides & Engine Review Workflow

**الحالة:** `PHASE_5_IMPLEMENTATION_PASSED`  
**الفرع:** `feat/admin-command-center-foundation`  
**الالتزام الأساسي (Base SHA):** `f246704ffc055bbc5d7e188a6282620f3aeed492`  
**اعتماد مسبق:** `PHASE_4_IMPLEMENTATION_ACCEPTED_FOR_CONTINUATION`  
**الإنتاج (Production):** لم يُمس  
**QA المستقل:** مؤجّل إلى بوابة QA الشاملة لـ Training Strategy V1  

---

## 1. الملخص التنفيذي

نُفِّذت طبقة **تعديلات المدرب (Coach Override)** كمنسّق فوق محرك التدريب V2 ومنسّق التعيين (Phase 4)، دون إنشاء محرك تدريب جديد ودون تعديل اللقطة النشطة مباشرة.

المسار المعتمد:

```
طلب المدرب → مراجعة المحرك → تحليل الأثر → مرشّح مُعاد توليده ومُحقَّق → تأكيد المدرب → تعيين نسخة جديدة → Runtime العميل
```

- **مراجعة مركزية:** `reviewCoachOverride()`
- **تطبيق آمن:** `applyCoachOverride()` → يعيد مرشّحاً جاهزاً لـ `assignGeneratedV2Program`
- **لا ترحيل قاعدة بيانات** — إثبات الاستخدام عبر `admin_record_adaptive_decision` مع `change_source: COACH_OVERRIDE`

---

## 2. الالتزام الأساسي

```
f246704ffc055bbc5d7e188a6282620f3aeed492
feat(training): Phase 4 assignment orchestration layer
```

---

## 3. عزل Git

الملفات المضمنة في commit المرحلة 5 فقط:

| الملف | الإجراء |
|---|---|
| `src/lib/platform/coach-override/*` | جديد |
| `src/components/admin/ClientTrainingWorkspace.tsx` | تعديل |
| `package.json` | بوابة اختبار |
| `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_5_REPORT.md` | هذا التقرير |

مستبعد: التغذية، الوسائط، المدفوعات، Auth، Quiz، Supabase migrations.

---

## 4. تدقيق القدرات الحالية

| الطبقة | إعادة الاستخدام |
|---|---|
| `prepareTrainingProgramAssignment()` | إعادة توليد المرشّح بعد التعديل |
| `explainEligibility` + `filterEligibleExercises` | أهلية الاستبدال |
| `rankCandidates` | ترتيب البدائل |
| `resolveWeeklyTrainingSchedule` | مراجعة التقويم |
| `resolveStrategyTrainingLocation` | تعديل HOME/GYM |
| `admin_assign_generated_v2_program` | التعيين النهائي |
| `admin_record_adaptive_decision` | أثر/تتبع بدون جدول جديد |

---

## 5. عقد التعديل (Override Contract)

`CoachOverrideRequest` يتضمن:

- `clientId`, `currentAssignmentId`
- `overrideType` (typed)
- `payload` (typed per type)
- `source` (`COACH_ADMIN` | `CLIENT_REQUEST`)
- `coachNote` (اختياري)
- `sourceAssignmentVersion` (كشف التقادم)

---

## 6. أنواع التعديل المدعومة (V1)

`TRAINING_DAYS_CHANGE` · `PREFERRED_WEEKDAYS_CHANGE` · `SESSION_DURATION_CHANGE` · `EXERCISE_REPLACE` · `EXERCISE_EXCLUDE` · `EXERCISE_LOCK` · `TRAINING_LOCATION_CHANGE` · `AVAILABLE_EQUIPMENT_CHANGE` · `TRAINING_FREQUENCY_CHANGE` · `TEMPORARY_CONSTRAINT`

**خارج النطاق:** تجاوز السلامة، التقدم، الحجم، Goal Intelligence، التغذية، الفوترة.

---

## 7. محرك المراجعة

`reviewCoachOverride()` — قواعد حتمية فقط (بدون LLM كسلطة).

---

## 8. حالات المراجعة

| الحالة | المعنى |
|---|---|
| `SAFE` | يمكن المتابعة |
| `SAFE_WITH_IMPACT` | مسموح مع أثر على بُعد تدريبي |
| `ALTERNATIVE_RECOMMENDED` | البديل المقترح أفضل/أكثر أماناً |
| `BLOCKED` | مخالفة قاعدة صلبة |

---

## 9. تحليل الأثر

أبعاد منظمة: `WEEKLY_FREQUENCY`, `RECOVERY_SPACING`, `MOVEMENT_COVERAGE`, `MUSCLE_COVERAGE`, `GOAL_EMPHASIS`, `SESSION_DURATION`, `EQUIPMENT_ELIGIBILITY`, `LOCATION_ELIGIBILITY`, `EXERCISE_SUBSTITUTION`, `SAFETY`, `TOTAL_VOLUME`, `CONTINUITY`, `NUTRITION_REVIEW`.

---

## 10. أولوية السلامة

السلامة > تعديل المدرب > تفضيل العميل. قفل/استبدال تمرين محظور بسبب إصابة → `BLOCKED` + `SAFETY_RESTRICTION`.

---

## 11–19. سلوكيات الأنواع الرئيسية

- **استبدال تمرين:** أهلية Core 100 + Safety + موقع + معدات + مستوى؛ بدائل عبر `suggestExerciseAlternatives`
- **استبعاد/قفل:** يمر عبر إعادة التوليد؛ القفل غير الصالح → محظور
- **التكرار/الأيام:** إعادة توليد كاملة (ليس حذف جلسة يدوياً)
- **مدة الجلسة:** `SESSION_DURATION_CHANGE` عبر Strategy overrides
- **الموقع/المعدات/المؤقت:** `TEMPORARY_CONSTRAINT` لا يغيّر ملف العميل الدائم في DB — يُطبَّق على سياق التوليد فقط
- **التأكيد:** `applyCoachOverride` → مرشّح → تعيين عبر RPC موجود
- **النسخ:** التعيين السابق يبقى في التاريخ (`replaced`)
- **الإثبات:** `CoachOverrideProvenance` + snapshot في قرار `PROGRAM_GENERATION`

---

## 20–27. الحماية والتشغيل

- **تقادم:** `sourceAssignmentVersion` ≠ الحالي → `STALE_ASSIGNMENT`
- **Idempotency:** `applyKey` في الذاكرة يمنع تكرار غير متحكم (اختبارات)
- **لا تعديل لقطة من الواجهة:** المرشّح فقط ثم RPC
- **وضع ASSISTED:** يبقى المعتمد من Phase 4
- **AUTOMATED:** يبقى معطّلاً عالمياً
- **المصدر:** `changeSource: COACH_OVERRIDE` مميز عن `SYSTEM_ADAPTATION`

---

## 28. مساحة عمل المدرب

قسم **«تعديلات المدرب»** في `ClientTrainingWorkspace.tsx`:

1. اختيار نوع التعديل  
2. مراجعة المحرك  
3. عرض الأثر والبدائل  
4. تأكيد وبناء مرشّح جديد  
5. تعيين عبر مسار V2 الموجود  

حالات UI: `idle` · `editing` · `reviewing` · `confirming` · `applying` · `success` · `error`

---

## 29. الأمان

- العميل لا يستدعي مسارات Admin (اختبارات موجودة)
- RPCات Admin محمية بـ `_require_admin`

---

## 30. قاعدة البيانات

**لا تغييرات schema.**  
التتبع عبر `admin_record_adaptive_decision` + `input_snapshot` JSON.  
**لم يُرجَع** `PHASE_5_DB_CHANGE_REQUIRES_APPROVAL`.

---

## 31–33. الحدود

- **Entitlements:** جودة التحقق لا تتغير حسب الباقة؛ واجهة المدرب Admin فقط
- **التغذية:** لم تُمس — قد يُوصى `NUTRITION_REVIEW_RECOMMENDED` بدون تعديل تلقائي
- **Multi-coach:** لا تجميد «مدرب واحد للأبد» — الهوية من جلسة Admin الحالية

---

## 34. الاختبارات

**جديد:** `coach-override.test.ts` — 15+ سيناريو (استبدال، سلامة، موقع، استبعاد، قفل، تكرار، تقويم، مدة، مؤقت، حتمية، إلغاء، تقادم، idempotency، أمان)

**انحدار:** Phase 4 orchestrator · Core 100 144/144 · Safety · `npm test` · `npm run build`

---

## 35. npm test / Build

| البوابة | النتيجة |
|---|---|
| `npm test` | **PASS** |
| `npm run build` | **PASS** |
| Core 100 QA | **144/144** |
| Core 100 Safety | **PASS** |
| Phase 4 regression | **PASS** |

---

## 36. تدقيق Hard-Code / العشوائية

- لا `Math.random` في مسار coach-override
- لا تجاوز FULL_CATALOG
- لا تعديل kg ثابت

---

## 37. مخاطر معروفة

1. تتبع التعديلات في الذاكرة + adaptive decision — ليس جدول overrides مخصص (قرار V1 لتجنب migration)
2. `TEMPORARY_CONSTRAINT` لا يخزّن تاريخ انتهاء في DB بعد
3. مسار القوالب القديمة ما زال موجوداً بجانب V2

---

## 38. قرارات مفتوحة

1. جدول `coach_override_requests` مستقبلي إذا طلبت المنتجات سجل تدقيق أغنى
2. تفعيل طلبات العميل من المحادثة (مصدر `CLIENT_REQUEST`) — بنية جاهزة، UX لاحق
3. QA المستقل المؤجّل حتى إغلاق استراتيجية التدريب V1 كاملة

---

## 39. مصفوفة القبول

| المتطلب | الحالة |
|---|---|
| عقد Override مركزي | PASS |
| Engine Review مركزي | PASS |
| لا تعديل لقطة مباشر | PASS |
| السلامة لا تُتجاوز | PASS |
| استبدال مُحقَّق | PASS |
| بدائل عند الحاجة | PASS |
| تكرار → إعادة توليد | PASS |
| تقويم → Calendar Resolver | PASS |
| تاريخ محفوظ | PASS |
| تقادم Override | PASS |
| Idempotency | PASS |
| عميل لا يعدّل | PASS |
| التغذية لم تُمس | PASS |
| AUTOMATED معطّل | PASS |
| Core 100 100/100 | PASS |
| 144/144 | PASS |
| npm test / build | PASS |
| Production | لم يُمس |

---

## 40. الحكم النهائي

**`PHASE_5_IMPLEMENTATION_PASSED`**

> **ملاحظة:** هذه **ليست** `CLOSED_APPROVED` — QA المستقل مؤجّل عمداً إلى بوابة V1 الشاملة.

---

**OPEN DECISIONS:**
- جدول persistence مخصص للتعديلات (اختياري لاحقاً)
- ربط طلبات العميل من المحادثة
- توقيت QA الشامل

**BLOCKERS:**
- لا يوجد للتنفيذ المحلي

**KNOWN RISKS:**
- تتبع عبر adaptive decisions وليس جدول overrides
- قيود مؤقتة بدون انتهاء في DB

**RECOMMENDED NEXT PHASE:**
- **Phase 6 — Hardening, Full System QA Preparation & Launch Gates**
