# تقرير تسليم شامل — MAAKFIT Training Strategy V1 + Command Center

**الجمهور:** مطوّر Platform  
**التاريخ:** 2026-08-31  
**الغرض:** ما هو مرفوع، ما هو منشور، ما يجب تنفيذه على Git / Vercel / Production — بدون خلط المسارات  
**حالة التسليم:** `PLATFORM_HANDOFF_PUBLISHED`

---

## 1. الملخص التنفيذي

| الطبقة | الحالة الحالية | إجراء المطوّر |
|--------|----------------|---------------|
| **Git — فرع الميزة** | مرفوع بالكامل إلى `origin` | مراجعة + PR إلى `main` **بعد** إغلاق بوابات Production |
| **Git — `main`** | **لم يُدمَج** فرع Training V1 | **لا تدمج الآن** — يفعّل `vercel --prod` تلقائياً |
| **Vercel Staging** | منشور @ `6d2d31d` على `staging.hakimlemagicien.com` | إعادة نشر عند تحديث SHA فقط (يفضّل Linux CI Node 22) |
| **Vercel Production** | **لم يُمس** (`main` = `0a3e784`) | **ممنوع** حتى PF-2/PF-3 |
| **Supabase Staging** | migrations + Core 100 + fixtures جاهزة | صيانة fixtures فقط |
| **Supabase Production** | **لم تُطبَّق** migrations V2 | سلسلة migration إلزامية قبل أي deploy |

**حكم QA (domain):** `TRAINING_STRATEGY_V1_QA_PASSED_WITH_NONBLOCKING_RISKS`  
**حكم E2E:** `TRAINING_STRATEGY_V1_E2E_PASSED_WITH_NONBLOCKING_RISKS`  
**حكم Fixtures:** `TRAINING_V1_STAGING_FIXTURES_READY`

---

## 2. Git — ما هو مرفوع (Push) بالفعل

### 2.1 الفرع المعتمد

| البند | القيمة |
|--------|--------|
| **Branch** | `feat/admin-command-center-foundation` |
| **Remote** | `origin/feat/admin-command-center-foundation` |
| **Artifact كود QA** | `6d2d31d029ca554baf0ddf85d00132fc45e9f611` |
| **Tip SHA (قبل commit التسليم)** | `b557f625022cb897fc4b92414cf84720176a3255` |
| **تقدّم عن `main`** | **21 commit** (قبل commit التسليم) |

### 2.2 سلسلة Commits الحرجة (Training Strategy)

```
b557f62  docs(training): Phase 6 QA handoff metadata
6d2d31d  feat(training): Phase 6 hardening and QA readiness gates      ← artifact QA
74b1b0c  feat(training): Phase 5 coach override workflow
f246704  feat(training): Phase 4 assignment orchestration
af93b4e  docs(training): Phase 3 independent QA report
5d92b3e  fix(training): close Phase 3 QA test gate
7b2efea  feat(training): activate Strategy Matrix Core 100 V1
4d80f8d  Connect Training Engine V2 client loop for staging QA
… + Command Center Phases 1–6, Legal/Billing, Brand MAAKFIT
```

### 2.3 التقارير في المستودع

| المستند | المسار |
|---------|--------|
| تقارير Phase 0–6 | `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_*` |
| QA fixtures | `docs/MAAKFIT_TRAINING_STRATEGY_QA_FIXTURES.md` |
| Full QA (E2E) | `docs/dane/MAAKFIT_TRAINING_STRATEGY_V1_FULL_QA_REPORT.md` |
| **هذا التسليم** | `docs/MAAKFIT_TRAINING_STRATEGY_V1_PLATFORM_HANDOFF.md` |

### 2.4 ما **لا يجب** دمجه في Push التسليم

| المسار | الطبيعة |
|--------|---------|
| `public/exercises/**` | صور stages/anatomy |
| `src/components/auth/`, `quiz-onboarding-api.ts` | Auth/Quiz |
| `exercise-stage-media*` | Exercise media pipeline |
| `docs/PAYMENTS_AND_SUBSCRIPTIONS_V1.md` | مسار منفصل |
| `.qa-phase3-*`, `.qa-full-v1-6d2d31d/` | worktrees مؤقتة |

---

## 3. Vercel — Staging (منشور)

| البند | القيمة |
|--------|--------|
| **Canonical URL** | https://staging.hakimlemagicien.com |
| **Deployment ID** | `dpl_KSzu1eNrWVN2HKoHeZxvGQqgZfYy` |
| **Preview URL** | `hakimlemagicien-pghnjxop8-hakim-le-magicien.vercel.app` |
| **Target** | **Preview فقط** |
| **Source SHA** | `6d2d31d` |
| **Supabase** | `dxerwrdpcflpnjvsnrjq` |
| **HTTP** | `/`, `/app`, `/admin` → **200** |

### ملاحظة SSR (DEPLOYMENT_ARTIFACT_DEVIATION)

`vercel deploy --prebuilt` من macOS/Node 24 قد يعطي 500 (`__exportAll` circular import).  
**حل مؤقت:** patch deploy-time على chunk SSR (غير موجود في Git).  
**حل دائم:** بناء prebuilt على **Linux CI (Node 22)** — `.github/workflows/deploy.yml` / `deploy-staging.yml`.

---

## 4. Vercel — Production (لم يُلمَس)

| البند | القيمة |
|--------|--------|
| **`main` SHA** | `0a3e784` — PR #8 coaching-messaging-v1 |
| **Production URL** | https://hakimlemagicien.com |
| **قرار CEO** | `PRODUCTION_RELEASE_NOT_APPROVED` |
| **خطر الدمج المبكر** | `client_get_my_training_runtime` غير موجود على Production DB |

---

## 5. Supabase — Staging

### 5.1 Migrations (من الفرع)

```
20260820120000_legal_billing_privacy_v1.sql
20260820210000_admin_command_center_data_contracts.sql
20260820220000_admin_ops_read_extensions.sql
20260820230000_admin_library_management.sql
20260820240000_client_program_assignment_snapshots.sql
20260820250000_client_nutrition_assignments.sql
20260821120000_training_engine_v2_data_contracts.sql
20260821140000_exercise_library_v2_compatibility.sql
20260821140100_exercise_library_v2_metadata_seed.sql
20260821160000_progression_history_duration.sql
20260821180000_client_loop_integration.sql
```

### 5.2 Fixtures (Staging DB — ليست في Git)

| Fixture | الحالة |
|---------|--------|
| **Core 100** | 100/100 — `validateCore100Config()` PASS |
| **CLIENT A** | profile كامل + assignment `6c94a134-91fe-4c69-85f6-ffa672b853cc` |
| **Runtime days** | **3** (`client_get_my_training_runtime`, `reason: ok`) |
| **CLIENT FREE** | `staging-client-free@qa.test` + tier `free` |

### 5.3 حسابات QA (Staging Auth)

| الدور | Email |
|--------|--------|
| ADMIN | `staging-admin@qa.test` |
| CLIENT A | `staging-client-a@qa.test` |
| CLIENT B | `staging-client-b@qa.test` |
| CLIENT FREE | `staging-client-free@qa.test` |

كلمات المرور: `.env.staging.local` فقط — لا Git.

---

## 6. Supabase — Production (ممنوع حالياً)

| البند | الحالة |
|--------|--------|
| **Project** | `ufgrbpakuemamggwypdh` |
| **آخر migration معروف** | ~`20260816180000` |
| **تطبيق migrations الفرع** | **لم يُنفَّذ** — PF-2 + PF-3 |

مرجع: [`TRAINING_ENGINE_V2_PRODUCTION_MIGRATION_AND_ROLLBACK.md`](./TRAINING_ENGINE_V2_PRODUCTION_MIGRATION_AND_ROLLBACK.md)

---

## 7. مخاطر Non-blocking (قبل Production)

| ID | الوصف |
|----|--------|
| **RB-V1-RPC-GOAL-FALLBACK** | RPC fallback `FAT_LOSS` — مُغلق client-side |
| **COACH_OVERRIDE_DURABLE_IDEMPOTENCY** | idempotency جلسة فقط |
| **DEPLOYMENT_ARTIFACT_DEVIATION** | SSR patch عند prebuilt محلي |
| **AUTOMATED_ASSIGNMENT** | معطّل عالمياً — لا تفعّل |

---

## 8. خطة تنفيذ للمطوّر

### A — Git

1. مراجعة PR من `feat/admin-command-center-foundation` → `main` (**Draft — لا merge**)
2. **لا** دمج قبل PF-2/PF-3

### B — Staging Vercel (عند تحديث SHA)

```bash
git checkout 6d2d31d   # أو tip بعد مراجعة
npm test
npm run build -- --mode staging
# يُفضّل: deploy-staging.yml على Linux
npx vercel deploy --prebuilt --yes
npx vercel alias set <preview-url> staging.hakimlemagicien.com
```

**ممنوع:** `vercel --prod`

### C — Production (بعد PF-2/PF-3)

1. Migration dry-run على clone Production  
2. تطبيق migrations على `ufgrbpakuemamggwypdh`  
3. seed Core 100 (نفس المصدر الرسمي)  
4. Merge → `main` → deploy تلقائي  
5. Smoke: `client_get_my_training_runtime`, `/app`, `/admin`

---

## 9. جدول مرجعي سريع

| السؤال | الجواب |
|--------|--------|
| SHA للاختبار | `6d2d31d029ca554baf0ddf85d00132fc45e9f611` |
| Staging deployment | `dpl_KSzu1eNrWVN2HKoHeZxvGQqgZfYy` |
| CLIENT A assignment | `6c94a134-91fe-4c69-85f6-ffa672b853cc` |
| Merge إلى `main` الآن؟ | **لا** |
| Production محدّث؟ | **لا** |

---

## 10. مراجع

- [`ENVIRONMENTS.md`](./ENVIRONMENTS.md)
- [`TRAINING_ENGINE_V2_STAGING_COHORT.md`](./TRAINING_ENGINE_V2_STAGING_COHORT.md)
- [`MAAKFIT_TRAINING_STRATEGY_QA_FIXTURES.md`](./MAAKFIT_TRAINING_STRATEGY_QA_FIXTURES.md)
- [`dane/MAAKFIT_TRAINING_STRATEGY_V1_FULL_QA_REPORT.md`](./dane/MAAKFIT_TRAINING_STRATEGY_V1_FULL_QA_REPORT.md)

---

**الخلاصة:** Git Push لـ Training V1 **مكتمل** على الفرع. Staging (Vercel + DB + fixtures) **جاهز**. Production **مجمّد** حتى PF-2/PF-3.
