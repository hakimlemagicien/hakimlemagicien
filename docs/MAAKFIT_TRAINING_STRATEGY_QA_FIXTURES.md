# MAAKFIT Training Strategy V1 — دليل إعداد QA على Staging

**الغرض:** تجهيز فريق QA المستقل لاختبار النظام المتكامل (Phase 1–6)  
**الإنتاج:** ممنوع — استخدم Staging فقط (`dxerwrdpcflpnjvsnrjq`)  
**كلمات المرور:** لا تُخزَّن في هذا المستند  

---

## 1. المتطلبات

- فرع التنفيذ: `feat/admin-command-center-foundation`
- SHA نهائي: يُحدَّد في `MAAKFIT_TRAINING_STRATEGY_PHASE_6_REPORT.md`
- `.env.staging.local` أو آلية البيئة المعتمدة في `docs/ENVIRONMENTS.md`
- حساب Admin/Coach مصرّح
- حسابات عميل اختبار (انظر §2)

---

## 2. حسابات الاختبار (أنواع)

| المعرف | الدور | الهدف |
|--------|--------|--------|
| **CLIENT A** | Essential/Premium مدفوع | مسار تدريب شخصي كامل V2 |
| **CLIENT B** | عميل ثانٍ | عزل RLS — لا وصول لبيانات A |
| **CLIENT FREE** | Free | حدود Entitlement — لا برنامج مدفوع كامل |
| **ADMIN** | مدرب/Admin | توليد، تعيين، Override |

أنشئ الحسابات في Staging عبر التسجيل/الدعوة المعتادة. سجّل `user_id` في ملاحظات QA الداخلية (خارج Git).

---

## 3. بيانات ملف العميل الموصى بها (CLIENT A)

| الحقل | قيمة مقترحة |
|--------|-------------|
| الهدف | `FAT_LOSS` (canonical) |
| المستوى | `INTERMEDIATE` |
| أيام/أسبوع | 3 |
| البيئة | `gym` أو `home` |
| إصابات | `none` أو `knee` لاختبار السلامة |

---

## 4. سيناريوهات QA الإلزامية

### 4.1 التعيين (Phase 4)

1. Admin → عميل → **توليد برنامج V2**
2. مراجعة المرشّح → **تعيين**
3. عميل → `/app` → تمرين → تسجيل مجموعات → إكمال
4. تكرار تعيين بدون `replace` → يجب أن يُرفض (`active_assignment_exists`)

### 4.2 Coach Override (Phase 5)

1. برنامج نشط → **تعديلات المدرب** → مدة جلسة / استبدال تمرين
2. **مراجعة التعديل** → تأكيد → مرشّح جديد → تعيين
3. تعديل قديم بعد تغيّر التعيين → `STALE_ASSIGNMENT`

### 4.3 الحدود

| السيناريو | النتيجة المتوقعة |
|-----------|------------------|
| هدف غير معرّف | BLOCKED |
| Free + Automated | BLOCKED |
| استبدال تمرين غير آمن | BLOCKED أو بديل |
| Refresh أثناء التمرين | البرنامج محفوظ |
| وسائط تمرين مفقودة | fallback — التمرين يعمل |

### 4.4 المصفوفة الآلية (مطور)

```bash
npm test
# يشمل: core-100-qa (144/144), safety, assignment orchestrator, coach-override, phase-6
```

---

## 5. بوابات البناء

```bash
npm test
npm run build
npm run build -- --mode staging
```

---

## 6. عزل البيئة

```bash
npx tsx src/lib/env/assert-environment.test.ts
```

Staging build → Staging Supabase فقط. لا `ufgrbpakuemamggwypdh` في runtime Staging.

---

## 7. مخاطر معروفة لـ QA

1. **RPC `admin_assign_generated_v2_program`:** fallback `FAT_LOSS` عند غياب `goal_id` — **مُغلق من الواجهة/API** عبر `validateV2AssignmentPayload`
2. **مسار القوالب القديمة:** منفصل عن Strategy Matrix V1 — لا يستخدم Core 100
3. **Override idempotency:** جلسة المتصفح + RPC `active_assignment_exists` — ليس جدول DB مخصص

---

## 8. تقارير المراحل

- `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_4_REPORT.md`
- `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_5_REPORT.md`
- `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_6_REPORT.md`

---

## 9. قائمة تحقق QA المستقل

- [ ] Core 100 — 100/100
- [ ] Matrix — 144/144
- [ ] Assisted assign E2E
- [ ] Override E2E
- [ ] Stale candidate/override
- [ ] Free entitlement
- [ ] Cross-client RLS (يدوي على Staging)
- [ ] Production لم يُمس
