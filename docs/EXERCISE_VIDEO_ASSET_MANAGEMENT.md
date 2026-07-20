# Exercise Video Asset Management — قرار تنفيذي معتمد

**الحالة:** معتمد للتنفيذ · **الأولوية:** عالية جداً  
**التاريخ:** 2026-07-20  
**المرجع التقني:** [`docs/EXERCISE_VIDEO_LIBRARY_REPORT.md`](EXERCISE_VIDEO_LIBRARY_REPORT.md)

---

## 1. ملخص القرار (CEO)

| المبدأ | التطبيق |
|--------|---------|
| بيانات التمرين مستقلة عن الفيديو | الاسم، العضلات، التصنيف — من `public.exercises` فقط |
| المعرّف التشغيلي | **`external_id`** (مثل `CH-001`, `AB-002`) — **ليس** اسم التمرين |
| Placeholder مشترك | **ملف واحد** — لا نسخة لكل تمرين |
| فيديو حقيقي | `exercises/{external_id}/exercise.mp4` |
| حالة الفيديو | مستقلة عن وجود الرابط |

---

## 2. المسارات المعتمدة (Storage)

| النوع | المسار |
|-------|--------|
| Placeholder مشترك (أداء) | `exercises/placeholders/default-exercise.mp4` |
| Placeholder مشترك (تعليمات) | `exercises/placeholders/default-instructions.mp4` |
| فيديو حقيقي | `exercises/{external_id}/exercise.mp4` |
| تعليمات حقيقية | `exercises/{external_id}/instructions.mp4` |

**ثابت التطبيق:** [`src/lib/platform/exercise-media.ts`](../src/lib/platform/exercise-media.ts)

---

## 3. حالات الفيديو

| الحالة | المعنى | العرض في المنصة |
|--------|--------|-----------------|
| `placeholder` | لا فيديو حقيقي معتمد | Placeholder المشترك |
| `ready` | فيديو معتمد | `video_path` الحقيقي |
| `review_required` | مرفوع، لم يُعتمد | Placeholder (لا يُعرض غير المعتمد) |
| `rejected` | مرفوض بعد المراجعة | Placeholder |
| `missing` | لا فيديو ولا fallback متوقع | Placeholder → ثم UI بديل |

**Migration:** [`supabase/migrations/20260720180000_exercise_video_asset_management.sql`](../supabase/migrations/20260720180000_exercise_video_asset_management.sql)

---

## 4. منطق العرض (Platform)

```text
1. video_status = ready AND video_path صالح → فيديو حقيقي
2. وإلا → Placeholder المشترك
3. فشل التحميل → بطاقة التمرين + أيقونة بديلة (الاسم يبقى ظاهراً)
```

**الملفات:**
- [`src/lib/platform/exercise-media.ts`](../src/lib/platform/exercise-media.ts) — `resolveExerciseMediaSource()`
- [`src/components/platform/exercises/ExerciseMedia.tsx`](../src/components/platform/exercises/ExerciseMedia.tsx)
- [`src/components/platform/exercises/ExerciseThumbnail.tsx`](../src/components/platform/exercises/ExerciseThumbnail.tsx)

---

## 5. نموذج البيانات (Schema)

### حقول موجودة
- `external_id`, `video_status`, `video_path`, `instructions_status`, `instructions_video_path`

### حقول مضافة (Migration 20260720180000)
- `video_updated_at`, `video_reviewed_at`, `video_reviewed_by`
- `video_version`, `video_file_size`, `video_mime_type`
- نفس الحقول لـ `instructions_*`

### قاعدة DB
- **`video_path = NULL`** عند `placeholder` — لا تخزين مسار مكرر
- **`video_path` مملوء** فقط عند `ready`

---

## 6. السكربتات التشغيلية

| السكربت | الغرض |
|---------|-------|
| [`scripts/sync-videos.sh`](../scripts/sync-videos.sh) | رفع Placeholder مشترك + فيديوهات حقيقية فقط (hash ≠ placeholder) |
| [`scripts/migrate-exercise-video-assets.sh`](../scripts/migrate-exercise-video-assets.sh) | تقرير + Manifest + ترحيل آمن (حذف duplicates بعد QA) |

### رفع فيديو حقيقي لتمرين واحد

```bash
# 1. استبدل الملف محلياً (hash مختلف عن placeholder)
# Exercise Library/<Group>/<external_id>-<slug>/exercise.mp4

# 2. Sync تمرين واحد
./scripts/sync-videos.sh --exercise CH-001

# النتيجة:
# - video_status = ready
# - video_path = exercises/CH-001/exercise.mp4
# - باقي التمارين placeholder → Placeholder مشترك
```

### Dry-run

```bash
./scripts/sync-videos.sh --dry-run
./scripts/migrate-exercise-video-assets.sh
```

---

## 7. خطة الترحيل (8 مراحل — CEO)

| # | المرحلة | الأداة | الحالة |
|---|---------|--------|--------|
| 1 | إنشاء Placeholder مشترك | `sync-videos.sh` | ✅ منطق جاهز |
| 2 | تقرير شامل | `migrate-exercise-video-assets.sh` | ✅ Manifest JSON |
| 3 | Backup / Manifest | `docs/exercise-video-migration-manifest.json` | ⏳ عند التشغيل |
| 4 | تحديد duplicates (SHA/eTag) | Migration script | ✅ |
| 5 | تحديث DB → placeholder + NULL paths | Migration `--apply` | ⏳ بعد QA |
| 6 | اختبار ظهور جميع التمارين | QA | ⏳ |
| 7 | التحقق من external_id / الأسماء | QA + Library Manager | ⏳ |
| 8 | حذف duplicates المؤكدة | Migration `--apply` | ⏳ بعد QA |
| 9 | تقرير المساحة المحررة | Manifest + Report | ⏳ |

**⚠️ لا تشغّل `--apply` قبل:**
1. `./scripts/migrate-exercise-video-assets.sh` (تقرير)
2. مراجعة QA
3. Backup Manifest محفوظ

---

## 8. الوضع الحالي (Baseline)

| المؤشر | القيمة |
|--------|--------|
| تمارين في الكatalóg | 320 |
| فيديوهات Storage (محلي + Supabase) | 640 |
| حجم إجمالي | ~4.58 GiB |
| محتوى فعلي | **Placeholder واحد × 640** |
| DB حالياً | `ready` (خطأ — يُصحَّح بالترحيل) |
| توفير متوقع بعد الترحيل | **~99%** (~4.57 GiB) |

---

## 9. مسؤوليات الفرق

### 🏋️ Exercise Library Manager
- [ ] مراجعة `external_id` لـ 320 تمرين
- [ ] تصنيف placeholder vs حقيقي
- [ ] قائمة أولويات التصوير
- [ ] اعتماد `review_required` → `ready`

### 🗄️ Database Architect
- [ ] Apply migration `20260720180000`
- [ ] التحقق من UNIQUE `external_id`
- [ ] Review Storage RLS (admin-only write)

### 💻 Platform Developer
- [x] منطق Placeholder + Fallback
- [x] تحديث sync-videos.sh
- [x] Migration script
- [ ] Deploy + تشغيل ترحيل Storage

### 🧪 QA Manager
- [ ] Checklist §26 من القرار التنفيذي
- [ ] اختبار استبدال تمرين واحد (CH-001)
- [ ] Cache refresh بعد الاستبدال
- [ ] اعتماد `--apply`

### 📚 Documentation Manager
- [x] هذا المستند
- [ ] تحديث MASTER_PROJECT_DOCUMENTATION §13

---

## 10. الممنوعات (ملخص)

❌ Placeholder منفصل لكل تمرين  
❌ تحديد التمرين بالاسم فقط  
❌ `ready` بدون فيديو حقيقي معتمد  
❌ حذف Storage قبل Manifest  
❌ إخفاء بطاقة التمرين عند فشل الفيديو  

---

## 11. Rollback Plan

1. **DB:** استعادة `video_path` / `video_status` من Manifest
2. **Storage:** duplicates محذوفة — استعادة من Manifest + re-upload عبر `sync-videos.sh`
3. **App:** revert commit — المنطق القديم يقرأ `video_path` مباشرة (لكن duplicates تعود)

**الأفضل:** اختبار على staging قبل `--apply` على production.

---

## 12. ترتيب التنفيذ المعتمد

```text
Exercise Library Manager Review
        ↓
Database Architecture Approval + Apply Migration
        ↓
Platform Development (deploy code)
        ↓
sync-videos.sh (shared placeholder)
        ↓
migrate-exercise-video-assets.sh (report → QA → --apply)
        ↓
QA Validation
        ↓
Documentation Update
```

---

**آخر تحديث:** Platform Development — كود المنصة + سكربتات جاهزة للمرحلة التشغيلية.
