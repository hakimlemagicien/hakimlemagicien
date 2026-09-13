# TRAINING_AUTO_ASSIGN_AND_ADMIN_REVIEW_SYSTEM — تقرير التنفيذ المحلي

TASK: TRAINING_AUTO_ASSIGN_AND_ADMIN_REVIEW_SYSTEM  
STATUS: **PASS_WITH_GAPS**  
DATE: 2026-09-13  
ENVIRONMENT: LOCAL_ONLY (`127.0.0.1:54321` / `127.0.0.1:54322`)

---

## EXECUTIVE_SUMMARY_AR

تم تشغيل نظام التعيين التلقائي الآمن للعملاء على Local فقط: قرارات Resolver (Exact+SAFE فقط) → Snapshot/Version جديد عند الحاجة → إشعار مراجعة للأدمن بدون انتظار موافقة عند التطابق الآمن. تمت مصالحة العملاء الحاليين بشكل idempotent، وصندوق المراجعات على `/admin/notifications`، ومركز تحكم التعيين داخل `ClientTrainingWorkspace`. لا Staging ولا Production.

---

## LOCAL_ENVIRONMENT_VERIFIED

YES — API `127.0.0.1:54321` · DB `127.0.0.1:54322`

## POLICY_CHANGE_IMPLEMENTED

YES — Exact + SAFE + لا fallback → `AUTO_ASSIGNED` / `AUTO_UPDATED` بدون موافقة أدمن؛ غير ذلك → `REVIEW_REQUIRED` أو `BLOCKED_NO_EXACT_MATCH` أو `COACH_OVERRIDE_ACTIVE`.

---

## EXISTING_CLIENTS_SCANNED

4 (بذور Phase 6 المحلية + سيناريوهات QA)

| Metric | Count |
|--------|------:|
| NO_CHANGE_REQUIRED_COUNT | 1 |
| AUTO_UPDATED_COUNT | 1 |
| REVIEW_REQUIRED_COUNT | 0 (في سيناريو المعدات الكافية؛ وPASS منفصل لـ missing equipment) |
| COACH_OVERRIDE_PRESERVED_COUNT | 1 |
| BLOCKED_NO_EXACT_MATCH_COUNT | 1 |

قبل تزويد السياق: المسح الأول أعطى 4× `REVIEW_REQUIRED` (INSUFFICIENT_CONTEXT) — سلوك صحيح (لا تخمين).

## NEW_CLIENT_AUTO_ASSIGN_RESULT

WORKING — `AUTO_ASSIGNED` عند fat/gym/BEGINNER/3d + معدات `treadmill` + `dumbbells_or_machines`؛ Snapshot عبر `client_auto_assign_program_template` + Review notification.

## NEW_CLIENT_REVIEW_REQUIRED_RESULT

WORKING — بدون معدات كافية → `MATCHED_WITH_REVIEW` → قرار `REVIEW_REQUIRED` (لا تعيين تلقائي).

## SAFE_MATCH_REQUIRES_ADMIN_APPROVAL

NO

## ADMIN_REVIEW_INBOX_RESULT

WORKING — `/admin/notifications` → `TrainingAssignmentReviewInbox` (فلاتر غير مراجعة / تحتاج تدخل / الكل، Mark Reviewed، View Client، View Template).

## ADMIN_CLIENT_TEMPLATE_CHANGE_RESULT

WORKING — تعيين/تغيير/Reassign/Coach Override عبر `ClientTrainingWorkspace` الحالي + لوحة `ClientTrainingAutoAssignPanel` (حالة القرار، السبب، Resolver، روابط Inbox/Library). بدون Deploy.

## CLIENT_CHANGE_REQUIRES_DEPLOY

NO

## ASSIGNMENT_HISTORY_RESULT

WORKING — لقطات سابقة تبقى `replaced`؛ العميل B بعد AUTO_UPDATED: active قديم + scheduled جديد.

## SNAPSHOT_IMMUTABILITY_RESULT

YES — لا تعديل على اللقطات التاريخية؛ تعيين جديد فقط.

## IN_PROGRESS_WORKOUT_SAFETY_RESULT

PASS_WITH_GAP — عند AUTO_UPDATE يُنشأ تعيين `scheduled` ليوم غد (`nextSafeStartsOn`) مع الإبقاء على الـ active الحالي.  
**Gap موثّق:** لا يوجد job ترويج موحّد من `scheduled`→`active` في هذه الحزمة؛ الحماية = عدم استبدال الجلسة الجارية فورًا. إن احتاج المنتج ترقية تلقائية عند منتصف الليل، تُسلَّم لمرحلة منفصلة.

## RECONCILIATION_IDEMPOTENCY

YES — المفتاح `(client_id, idempotency_key)` · إعادة التشغيل لا تكرر صفوف المراجعة.

## GLUTE_FEMALE_MEDIA_REGRESSION

PASS — `exercise-media-variants.test.ts` + `female-media-preference-handoff.test.ts`

## DUPLICATE_TEMPLATES_CREATED

0

## DUPLICATE_EXERCISES_CREATED

0

## DB_WRITES

LOCAL_ONLY — migration `20260913150000_training_auto_assign_admin_review.sql` مطبّقة على 54322 فقط.

## STAGING_CHANGED

NO

## PRODUCTION_CHANGED

NO

---

## WHAT_CHANGED_AR

1. Migration: جدول `training_assignment_reviews` + RPCs (admin list/upsert/mark، client upsert، `client_auto_assign_program_template`).
2. وحدة `src/lib/platform/training-auto-assign/` (types/decision، engine، review-api، اختبارات، reconcile + QA scripts).
3. ربط العملاء الجدد في `paid-training-auto-assign.ts` (مسار القالب أولًا؛ لا fallback صامت بعد قرار REVIEW/BLOCKED/OVERRIDE).
4. Inbox أدمن: `TrainingAssignmentReviewInbox` على `/admin/notifications`.
5. مركز تحكم عميل: `ClientTrainingAutoAssignPanel` داخل مساحة التدريب.

## WHAT_I_SHOULD_REVIEW_AR

- `/admin/notifications` مع بيانات المراجعة المحلية.
- عميل B: active Muscle + scheduled Fat ليوم غد.
- عميل C: `COACH_MANAGED` لم يُستبدل.
- عميل E: Glute HOME → BLOCKED بدون تخفيض.
- تغيير قالب يدوي من صفحة العميل والتأكد أن History يظهر نسخة جديدة.

## KNOWN_GAPS_AR

1. ترقية `scheduled`→`active` ليست كاملة كـ deferred activation pipeline.
2. حماية Coach Override عبر `COACH_MANAGED` / `coachProtected` (لا جدول override منفصل جديد).
3. Matrix fallback يبقى فقط عند فشل مسار القالب بخطأ استثنائي (ليس عند Coverage Gap).
4. قوالب كثيرة تحمل `review_signals` أو معدات ناقصة → `MATCHED_WITH_REVIEW` → لن تُعيَّن تلقائيًا (مقصود).
5. أنواع Supabase المولَّدة لم تُحدَّث بعد لـ `training_assignment_reviews` (استعلام عبر cast في اللوحة).

## RISKS_AR

- بدون ترويج scheduled قد يبقى العميل على البرنامج القديم حتى تدخل يدوي أو آلية لاحقة.
- نسخ قوالب مكررة لنفس المفتاح البُعدي (مثل FAT_LOSS …-copy/-v3) قد تؤثر على اختيار الفائز الحتمي — راقب slug/id.

## NEXT_STEP_AR

مراجعة QA/PM للـ Inbox وسيناريوهات A–F محليًا؛ لا Staging في هذه المرحلة.

## NEXT_HANDOFF

QA / Project Manager

---

### أوامر محلية مفيدة

```bash
# تطبيق الهجرة (محلي فقط — مطبّقة في هذه الجلسة)
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f supabase/migrations/20260913150000_training_auto_assign_admin_review.sql

# اختبار القرار
./node_modules/.bin/jiti src/lib/platform/training-auto-assign/training-auto-assign.test.ts

# مصالحة / QA (عبر esbuild بسبب قيود tsx في البيئة)
npx esbuild --bundle --platform=node --format=esm --packages=external --alias:@=./src \
  src/lib/platform/training-auto-assign/qa-scenarios-local.mts --outfile=.tmp/qa-scenarios-local.mjs
node .tmp/qa-scenarios-local.mjs
```
