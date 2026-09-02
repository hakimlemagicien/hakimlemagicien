# Core 100 — مكتبة وسائط التمارين (Strategy Matrix)

**المعرّف:** `external_id` (مثل `CH-001`، `LE-001`) — **ليس** اسم التمرين.

## المصدر الوحيد

```text
src/assets/content/core-100-exercises/{EXTERNAL_ID}/
```

- أضف صورة → تظهر بعد `npm run sync:core-100-media`
- احذف صورة → تختفي بعد المزامنة
- لا تعديل كود لكل تمرين

## هيكل كل مجلد تمرين

```text
CH-001/
  stages/
    stage-a.webp
    stage-a-thumb.webp
    stage-b.webp
    stage-b-thumb.webp
    stage-c.webp
    stage-c-thumb.webp
  mistakes/
    mistake-01.webp
    mistake-01-thumb.webp
    mistake-02.webp
    mistake-02-thumb.webp
  anatomy/
    anatomy.webp
    anatomy-thumb.webp
  video/
    exercise.mp4        ← فيديو الأداء (لاحقاً)
    instructions.mp4    ← فيديو التعليمات (اختياري)
```

## مسار العرض في التطبيق

بعد المزامنة تُنسخ الملفات إلى:

```text
public/exercises/{EXTERNAL_ID}/
```

والتطبيق يقرأها من `/exercises/{EXTERNAL_ID}/...` (كما اليوم).

## مسار الفيديو في Storage (بعد الرفع)

| الملف المحلي | مسار Supabase |
|--------------|---------------|
| `video/exercise.mp4` | `exercises/{EXTERNAL_ID}/exercise.mp4` |
| `video/instructions.mp4` | `exercises/{EXTERNAL_ID}/instructions.mp4` |

## الأوامر

```bash
# أول مرة — إنشاء 100 مجلد + استيراد الصور من public
npm run content:bootstrap-core-100

# بعد كل تعديل على الصور أو الفيديو المحلي
npm run sync:core-100-media

# جرد الصور والفيديو
npm run content:core-100-inventory
```

## الأولوية (خطة التصوير)

| الشريحة | التمارين | المرجع |
|---------|----------|--------|
| P1 | 01–40 | `core-100-external-ids.ts` |
| P2 | 41–80 | |
| P3 | 81–100 | |

## المرجع الكامل

[`docs/CONTENT_ASSETS.md`](../../../docs/CONTENT_ASSETS.md) — قسم Core 100

[`MANIFEST.json`](./MANIFEST.json) — حالة كل تمرين (يُحدَّث عبر bootstrap)
