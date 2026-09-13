# TRAINING_SCHEDULED_ASSIGNMENT_ACTIVATION_CLOSURE — تقرير نهائي

TASK: TRAINING_SCHEDULED_ASSIGNMENT_ACTIVATION_CLOSURE  
STATUS: **PASS** (محلي) — حالة النشر أدناه  
DATE: 2026-09-13

---

## EXECUTIVE_SUMMARY_AR

أُغلق فجوة ترقية `scheduled → active` عبر تفعيل كسول (lazy) داخل مسار القراءة الحالي: الدالة `activate_due_client_program_assignment` تُستدعى من `client_get_my_training_runtime` و`admin_get_client_overview`. عند حلول `starts_on` وغياب جلسة `IN_PROGRESS` يصبح المجدول هو الـ active الوحيد، واللقطة السابقة تُحفظ كـ `replaced`. لا موافقة يدوية. حماية Coach Override لجدولة AUTO/RECONCILE. لا إشعارات مكررة عند التفعيل.

---

## WHAT_CHANGED_AR

1. Migration: `supabase/migrations/20260913160000_scheduled_assignment_lazy_activation.sql`
2. Helper: `public.activate_due_client_program_assignment(uuid)`
3. `client_get_my_training_runtime` → **VOLATILE** + استدعاء التفعيل قبل الحل
4. `admin_get_client_overview` → نفس التفعيل حتى تتوافق واجهة الأدمن
5. سكربت QA: `scheduled-activation-qa.mts` (حالات A–F)
6. توثيق النوع في `engine.ts`

لا Cron جديد.

---

## LOCAL_QA_RESULT

PASS — جميع الحالات A–F

| Gate | Result |
|------|--------|
| SCHEDULED_ASSIGNMENT_AUTO_ACTIVATION | YES / PASS |
| MANUAL_ACTIVATION_REQUIRED | NO |
| IN_PROGRESS_WORKOUT_PROTECTION | PASS |
| COACH_OVERRIDE_PROTECTION | PASS |
| ACTIVATION_IDEMPOTENCY | PASS |
| DUPLICATE_ASSIGNMENTS | 0 |
| DUPLICATE_NOTIFICATIONS | 0 |
| NEW_CLIENT_AUTO_ASSIGN_REGRESSION | PASS (unit + immediate assign) |
| ADMIN_REASSIGN_REGRESSION | PASS (CASE E) |
| GLUTE_FEMALE_MEDIA_REGRESSION | PASS |

---

## CHANGES_SAVED / IMPLEMENTATION / PRODUCTION

تُحدَّث حقول النشر أدناه بعد خطوة SAVE/DEPLOY الفعلية في نفس الجلسة.

KNOWN_GAPS_AR:
- التفعيل يعتمد على فتح التطبيق/الأدمن (lazy) وليس job منتصف الليل — مقصود وأصغر حل.
- حماية Override تفرّق AUTO/RECONCILE عبر `training_assignment_reviews`؛ التعيين اليدوي من الأدمن بدون صف AUTO يُفعَّل حتى فوق COACH_MANAGED (سلوك مقصود لـ CASE E).

RISKS_AR:
- اختلاف منتصف الليل حسب `CURRENT_DATE` في DB.
- إن بقي scheduled due مع جلسة طويلة IN_PROGRESS، يتأخر التفعيل حتى انتهاء الجلسة (صحيح).
