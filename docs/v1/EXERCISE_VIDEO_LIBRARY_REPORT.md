# تقرير مكتبة فيديوهات التمارين — تحليل تقني وخطة تحسين Storage

**التاريخ:** 2026-07-20  
**النطاق:** مكتبة التمارين (320 تمرين × 2 فيديو)  
**المواقع المفحوصة:**
- محلي: `~/Documents/Hakim Coaching Platform/Exercise Library/`
- عنصر مرجعي: `~/Documents/Hakim Coaching Platform/Assets/placeholder-exercise.mp4`
- Supabase Storage: bucket `exercise-media` (عيّنة + حالة DB)
- الكatalóg: `scripts/exercise-library.json`

**ملاحظة:** لم يُجرَ أي تعديل أو حذف على الملفات — هذا تقرير قراءة فقط.

---

## 1. الملخص التنفيذي

| المؤشر | القيمة |
|--------|--------|
| **إجمالي الفيديوهات** | **640** (320 `exercise.mp4` + 320 `instructions.mp4`) |
| **الحجم الإجمالي (محلي)** | **4.58 GiB** (4,917,474,560 بايت / ~4.92 GB عشري) |
| **متوسط حجم الفيديو** | **7.33 MiB** (7,683,554 بايت) |
| **حالة المحتوى الفعلية** | **100% placeholder متطابق** — نفس الملف مُنسَخ 640 مرة |
| **حالة Supabase DB** | 320/320 `video_status=ready` و `instructions_status=ready` |
| **حالة metadata.json** | 306/320 `placeholder`؛ 14/320 بدون حقول حالة |

**الاستنتاج الرئيسي:** المكتبة **منظمة ومكتملة هيكلياً**، لكن **Storage يستهلك ~4.6 GiB لمحتوى placeholder واحد فقط**. إعادة الترميز + deduplication للـ placeholder وحدها توفر **~95%+** فوراً. عند استبدال الفيديوهات الحقيقية (~30 ثانية/فيديو حسب metadata)، يلزم **معيار ترميز موحّد** لتجنب تضخّم Storage إلى **15–25 GiB+**.

---

## 2. جرد الفيديوهات

### 2.1 العدد

| النوع | العدد |
|-------|-------|
| `exercise.mp4` | 320 |
| `instructions.mp4` | 320 |
| **المجموع** | **640** |
| صيغ أخرى (`.mov`, `.webm`) | 0 |

### 2.2 التوزيع حسب مجموعات العضلات (320 تمرين)

| المجموعة | عدد التمارين |
|----------|-------------|
| Legs | 45 |
| Back | 31 |
| Shoulders | 30 |
| Abs | 30 |
| Chest | 14 |
| Biceps | 20 |
| Triceps | 20 |
| Warm Up | 25 |
| Mobility | 25 |
| Glutes | 25 |
| Cardio | 25 |
| Forearms | 15 |
| Calves | 15 |

### 2.3 المسارات

**محلي:**
```text
Exercise Library/<MuscleGroup>/<ID>-<slug>/exercise.mp4
Exercise Library/<MuscleGroup>/<ID>-<slug>/instructions.mp4
```

**Supabase Storage (`exercise-media`):**
```text
exercises/<external_id>/exercise.mp4
exercises/<external_id>/instructions.mp4
```

---

## 3. الحجم والتخزين

### 3.1 الإحصائيات (محلي — فحص كامل)

| المؤشر | القيمة |
|--------|--------|
| الحجم الإجمالي | 4,917,474,560 بايت |
| بالـ GiB | **4.58 GiB** |
| بالـ GB (عشري) | **4.92 GB** |
| متوسط/فيديو | 7,683,554 بايت (**7.33 MiB**) |
| أصغر فيديو | 7,683,554 بايت |
| أكبر فيديو | 7,683,554 بايت |
| أحجام فريدة | **1** (جميع الملفات متطابقة) |

### 3.2 التحقق من التطابق (SHA-256)

| الملف المرجعي | Hash |
|---------------|------|
| `placeholder-exercise.mp4` | `20efd7ae63ecf8d01e1352bc64414d3aeab403cd504aee96f6006bb954a8803c` |
| 640/640 في المكتبة | **نفس الـ hash بالكامل** |

### 3.3 Supabase Storage (عيّنة + استنتاج)

- **320** مجلد تمرين في bucket `exercise-media`
- عيّنة (`AB-001`, `CH-001`): كل من `exercise.mp4` و `instructions.mp4` = **7,683,554 بايت**
- **نفس eTag** على جميع العيّنات → نفس المحتوى مرفوع
- DB: **320/320** مسارات `video_path` + `instructions_video_path` مع `status=ready`

**تقدير Storage على Supabase:** ~**4.58 GiB** (640 × 7.33 MiB)

---

## 4. المواصفات التقنية (ffprobe — placeholder المرجعي)

> بما أن جميع الـ 640 ملفاً متطابقاً byte-for-byte، هذه المواصفات تنطبق على **كل** الفيديوهات حالياً.

### 4.1 الفيديو

| الخاصية | القيمة |
|---------|--------|
| **الدقة (Resolution)** | **1080 × 1920** (Portrait 9:16) |
| **Codec** | **H.265 / HEVC** — Profile **Main 10** (10-bit) |
| **Tag الحاوية** | `hvc1` |
| **Pixel format** | `yuv420p10le` |
| **Frame rate** | 30 fps |
| **المدة** | **10.0 ثانية** |
| **Bitrate فيديو** | **~6.14 Mbps** (6,137,796 bps) |
| **عدد الإطارات** | 300 |
| **Color space** | BT.709 |

### 4.2 الصوت

| الخاصية | القيمة |
|---------|--------|
| **Codec** | **AAC-LC** (`mp4a.40.2`) |
| **Channels** | Stereo |
| **Sample rate** | 44,100 Hz |
| **Bitrate صوت** | ~2 kbps (شبه صامت) |

### 4.3 الحاوية (Container)

| الخاصية | القيمة | ملاحظة |
|---------|--------|--------|
| **Format** | QuickTime / MOV (`major_brand: qt`) | ليس MP4 web-standard |
| **Bitrate إجمالي** | **~6.15 Mbps** (6,146,843 bps) |
| **Fast Start (`moov` قبل `mdat`)** | **❌ لا** | `moov` عند offset 7,674,883 — **سيء للبث التدريجي** |
| **MIME المرفوع** | `video/mp4` | اسم صحيح لكن الحاوية QT |

### 4.4 جدول Resolution / Codec / Bitrate (حالة حالية)

| # | الملف | Resolution | Codec | Bitrate | المدة | الحجم |
|---|-------|------------|-------|---------|-------|-------|
| 1–640 | جميع `exercise.mp4` و `instructions.mp4` | 1080×1920 | HEVC Main 10 | ~6.15 Mbps | 10s | 7.33 MiB |

> **لا يوجد تنوع** في المواصفات حالياً — صف واحد يغطي المكتبة بالكامل.

---

## 5. مشاكل الأداء والـ Storage (مرتبطة بالترميز الحالي)

| # | المشكلة | التأثير |
|---|---------|---------|
| 1 | **Placeholder مكرر 640 مرة** | ~4.6 GiB wasted |
| 2 | **HEVC 10-bit** | دعم ضعيف على بعض Android/WebView القديمة |
| 3 | **بدون Fast Start** | بطء أول إطار + استهلاك bandwidth أعلى |
| 4 | **Bitrate مرتفع (~6 Mbps) لمحتوى 10s** | غير مناسب كهدف للمكتبة الكاملة |
| 5 | **metadata تقول 30s لكن الملف 10s** | عدم اتساق بين DB/metadata والملف |
| 6 | **DB status = `ready`** رغم placeholder | يضلل pipeline QA |

---

## 6. تقدير التوفير — إعادة الترميز

### 6.1 افتراضات التخطيط

| السenario | المدة المستهدفة | الاستخدام في التطبيق |
|---------|----------------|---------------------|
| A — placeholder محسّن | 10s (حالياً) | معاينة muted في thumbnails |
| B — فيديو حقيقي | **30s** (حسب metadata) | عرض تمرين + تعليمات |
| C — تعليمات | 45–60s | شرح Coach (تقدير) |

**سياق العرض:** شاشة هاتف، `object-contain`، `aspect-video` — **720p Portrait كافٍ بصرياً** لمعظم المستخدمين.

### 6.2 السenario 1 — تحسين الـ Placeholder الحالي (640 ملف × 10s)

| Profile | Resolution | Codec | Bitrate est. | حجم/فيديو | إجمالي 640 | توفير |
|---------|------------|-------|--------------|-----------|------------|-------|
| **الحالي** | 1080×1920 | HEVC 10-bit | 6.15 Mbps | 7.33 MiB | **4.58 GiB** | — |
| Web MP4 + faststart | 1080×1920 | H.264 High | ~2.5 Mbps | ~3.0 MiB | ~1.88 GiB | **~59%** |
| Web MP4 + faststart | 720×1280 | H.265 8-bit | ~1.2 Mbps | ~1.5 MiB | ~0.94 GiB | **~79%** |
| Web MP4 صامت | 720×1280 | H.265 8-bit | ~0.8 Mbps | ~1.0 MiB | ~0.63 GiB | **~86%** |
| **ملف placeholder واحد** (dedup) | 720×1280 | H.265 | ~0.8 Mbps | ~1.0 MiB | **~1 MiB** | **~99.98%** |

### 6.3 السenario 2 — فيديوهات حقيقية (320 تمرين × 2 × 30s)

**Baseline (بدون تحسين):** نفس profile الحالي × 3 (30s/10s)  
→ ~22 MiB/فيديو → **~13.7 GiB** للمكتبة

| Profile | Resolution | Codec | Bitrate | حجم/فيديو (30s) | إجمالي 640 | توفير vs baseline |
|---------|------------|-------|---------|-----------------|------------|-------------------|
| Baseline (HEVC 10-bit حالي) | 1080×1920 | HEVC 10 | ~6.15 Mbps | ~22 MiB | ~13.7 GiB | — |
| **Web-Optimized MP4 (موصى به)** | 1080×1920 | H.264 High | ~3.0 Mbps | ~11 MiB | **~6.9 GiB** | **~50%** |
| Web-Optimized MP4 | 720×1280 | H.264 High | ~1.8 Mbps | ~6.8 MiB | **~4.3 GiB** | **~69%** |
| **H.265 Web (موصى به)** | 1080×1920 | HEVC Main 8-bit | ~2.0 Mbps | ~7.5 MiB | **~4.7 GiB** | **~66%** |
| H.265 Web | 720×1280 | HEVC Main 8-bit | ~1.2 Mbps | ~4.5 MiB | **~2.8 GiB** | **~80%** |
| H.265 + بدون صوت | 720×1280 | HEVC Main 8-bit | ~1.0 Mbps | ~3.8 MiB | **~2.4 GiB** | **~83%** |

> **تقدير "بدون فقدان جودة ملحوظة على الهاتف":**  
> **H.265 720×1280 @ CRF 26–28** أو **H.264 1080×1920 @ CRF 23–25** — توفير **65–80%** مقابل baseline.

### 6.4 ملخص التوفير المتوقع

| المرحلة | الإجراء | Storage قبل | Storage بعد | التوفير |
|---------|---------|-------------|-------------|---------|
| **فوري** | إعادة ترميز placeholders + dedup | ~4.58 GiB | ~0.001–0.63 GiB | **86–99.98%** |
| **عند الإنتاج** | معيار H.265 720p للفيديو الحقيقي | ~13.7 GiB (baseline) | ~2.4–4.7 GiB | **66–83%** |
| **تشغيل** | Posters WebP + lazy load | — | −30–50% bandwidth | — |

---

## 7. خطة تحسين Storage (بدون فقدان جودة ملحوظة)

### المرحلة 0 — سياسة ترميز موحّدة (قبل رفع أي فيديو حقيقي)

**Master profile للتمارين (`exercise.mp4`):**

```bash
ffmpeg -i input.mp4 \
  -vf "scale=-2:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx265 -preset slow -crf 26 -tag:v hvc1 -pix_fmt yuv420p \
  -movflags +faststart \
  -an \
  -t 30 \
  output-exercise.mp4
```

**Master profile للتعليمات (`instructions.mp4`):**

```bash
ffmpeg -i input.mp4 \
  -vf "scale=-2:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx265 -preset slow -crf 24 -tag:v hvc1 -pix_fmt yuv420p \
  -c:a aac -b:a 96k -ac 1 \
  -movflags +faststart \
  -t 60 \
  output-instructions.mp4
```

| المعيار | exercise.mp4 | instructions.mp4 |
|---------|--------------|------------------|
| Resolution | **720×1280** Portrait | **720×1280** Portrait |
| Codec | **H.265 Main 8-bit** (`yuv420p`) | **H.265 Main 8-bit** |
| Fallback | H.264 High @ CRF 23 | H.264 High @ CRF 22 |
| Audio | **بدون صوت** (muted في UI) | **AAC mono 96 kbps** |
| Fast Start | **إلزامي** | **إلزامي** |
| Max duration | 30s | 60s |
| Container | `.mp4` (isom) — ليس QuickTime | `.mp4` |

**لماذا 720p وليس 1080p؟**  
عرض الفيديو في التطبيق `aspect-video` على شاشة ~390px — 720p Portrait أكثر من كافٍ؛ توفير **~40%** إضافي vs 1080p H.265.

**Fallback H.264:**  
للأجهزة التي لا تفك HEVC في `<video>` — يمكن توليد نسخة H.264 فقط عند الحاجة (أو الاعتماد على Safari/iOS HEVC + H.264 fallback في metadata).

---

### المرحلة 1 — Placeholder فوري (أكبر ROI)

1. **إنشاء placeholder واحد محسّن:**
   - 720×1280, H.265, 5–10s, **بدون صوت**, faststart
   - حجم مستهدف: **< 500 KB**
2. **خيار A (بدون تغيير app):** استبدال 640 ملفاً بنسخة محسّنة → **~320 MiB** بدل 4.58 GiB (**~93%**)
3. **خيار B (أفضل):** ملف placeholder واحد + symlink/copy في sync script + dedup Storage → **~1 MiB** (**~99.98%**)
4. **تصحيح DB:** `video_status` / `instructions_status` → `placeholder` حتى استبدال المحتوى الحقيقي

---

### المرحlage 2 — Pipeline الإنتاج (عند تصوير التمارين)

```text
Coach يسجّل → مجلد محلي → scripts/encode-exercise-video.sh (ffmpeg batch)
              → QA بصري على 3 أجهزة (iOS Safari, Android Chrome, Desktop)
              → sync-videos.sh (SHA-256 idempotent upload)
              → Supabase exercise-media
```

**قواعد QA قبل الرفع:**

| Check | Accept |
|-------|--------|
| Resolution | ≤ 720×1280 |
| Codec | H.265 8-bit أو H.264 |
| Fast Start | `moov` before `mdat` ✅ |
| Bitrate | ≤ 2.5 Mbps (exercise) / ≤ 3 Mbps (instructions) |
| Duration | exercise ≤ 30s, instructions ≤ 60s |
| File size | exercise ≤ 8 MiB, instructions ≤ 15 MiB |
| SHA duplicate | رفض رفع نفس hash لتمارين مختلفة |

---

### المرحلة 3 — تحسينات تشغيل (Bandwidth ≠ Storage لكن مهم)

| الإجراء | التأثير | ملاحظة |
|---------|---------|--------|
| **Posters `thumbnail.webp`** | −70% bandwidth على القوائم | `ExerciseThumbnail` يحمّل video اليوم |
| **Lazy load** | تحميل عند فتح التمرين فقط | موجود جزئياً |
| **`Cache-Control: 31536000`** | CDN/browser cache | حالياً `3600` في sync script |
| **Signed URL TTL 1h** | OK للأمان | لا يؤثر Storage |

---

### المرحلة 4 — أهداف Storage

| المرحلة | الهدف | Storage تقريبي |
|---------|-------|---------------|
| الآن (placeholder) | بعد تحسين | **< 500 MiB** |
| 50% تمارين حقيقية | معيار 720p H.265 | **~1.2 GiB** |
| 100% تمارين حقيقية | معيار 720p H.265 | **~2.4 GiB** |
| بدون تحسين (baseline) | HEVC 10-bit 1080p | **~13.7 GiB** |

**توفير سنوي متوقع vs baseline:** **~11 GiB** (~**80%**) عند اكتمال المكتبة بالمعيار الموصى به.

---

## 8. توصيات أولوية

| # | الإجراء | الأولوية | توفير | مجهود |
|---|---------|----------|-------|-------|
| 1 | إعادة ترميز placeholder → 720p H.265 faststart صامت | 🔴 عاجل | ~86–99% | منخفض |
| 2 | تصحيح `video_status` في DB/metadata | 🔴 عاجل | — (QA) | منخفض |
| 3 | سكربت `encode-exercise-video.sh` + CI check | 🟠 مهم | يمنع regression | متوسط |
| 4 | Posters WebP بدل video في thumbnails | 🟠 مهم | −bandwidth | متوسط |
| 5 | رفع `Cache-Control` للأصول النهائية | 🟡 | − egress | منخفض |
| 6 | H.264 fallback selective | 🟡 | توافق | متوسط |

---

## 9. الملحق — أوامر التحقق (read-only)

```bash
# عدد وأحجام محلي
find "$HOME/Documents/Hakim Coaching Platform/Exercise Library" -name "*.mp4" | wc -l
find "$HOME/Documents/Hakim Coaching Platform/Exercise Library" -name "*.mp4" -print0 \
  | xargs -0 stat -f%z | awk '{s+=$1;n++} END {print n, s, s/n}'

# ffprobe لملف واحد (يمثل الكل حالياً)
ffprobe -v quiet -print_format json -show_format -show_streams \
  "$HOME/Documents/Hakim Coaching Platform/Assets/placeholder-exercise.mp4"

# faststart check
python3 -c "
from pathlib import Path
b=Path('$HOME/Documents/Hakim Coaching Platform/Assets/placeholder-exercise.mp4').read_bytes()
print('faststart', b.find(b'moov') < b.find(b'mdat'))
"

# SHA-256 (التحقق من التطابق)
shasum -a 256 "$HOME/Documents/Hakim Coaching Platform/Assets/placeholder-exercise.mp4"
```

---

## 10. الخلاصة

المكتبة **640 فيdeo** بـ **4.58 GiB** إجمالي، **متوسط 7.33 MiB/فيدeo** — كلها **نسخة واحدة** من placeholder (**1080×1920, HEVC Main 10-bit, ~6.15 Mbps, 10s, بدون faststart**).

**أكبر فرصة توفير:** إعادة ترميز الـ placeholders فوراً (**86–99%**) + اعتماد **H.265 720×1280 faststart** للمحتوى الحقيقي (**66–83%** vs baseline عند 30s).

**لم يتم تعديل أي ملف** — هذا التقرير للتخطيط فقط.
