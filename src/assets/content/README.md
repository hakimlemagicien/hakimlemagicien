# قاعدة بيانات محتوى MAAKFIT

**المصدر الوحيد:** `src/assets/content/`

أي صورة تُضاف هنا تظهر في التطبيق تلقائياً بعد البناء.  
أي صورة تُحذف من هنا تختفي من التطبيق — **لا حاجة لتعديل الكود**.

## القاعدة الذهبية للجنس

| المجلد | من يراه |
|--------|---------|
| `ذكور/` | العملاء الذكور فقط |
| `بنات/` | العميلات الإناث فقط |

**لا تضع صور الذكور في `بنات/` والعكس.**

## المجموعات

| المجموعة | الاستخدام في التطبيق |
|----------|----------------------|
| `home-goal-hero/` | بطاقة الترحيب — `platform-home-hero__top` |
| `workout-goal-hero/` | بطاقة الهدف — صفحة التمرين |
| `workout-session-muscle/` | بطاقة حصة اليوم — العضلة المستهدفة (مشترك) |
| `core-100-exercises/` | **100 تمرين Strategy Matrix** — صور + فيديو لكل `external_id` |

## هيكل الرفع

```text
src/assets/content/
  home-goal-hero/
    ذكور/
      خسارة-الدهون/hero.webp
      بناء-العضلات/hero.webp
      ...
    بنات/
      خسارة-الدهون/hero.webp
      تكبير-المؤخرة/hero.webp
      ...
  workout-goal-hero/
    ذكور/...
    بنات/...
  workout-session-muscle/
    صدر.webp
    ظهر.webp
    صدر-وترايسبس.webp
    ... (14 ملف — انظر workout-session-muscle/README.md)
```

## الصيغ المدعومة

`webp` · `png` · `jpg` · `jpeg`

## تسمية الملفات

- صورة رئيسية: `hero.webp`
- تدوير يومي: `01.webp`، `02.webp`، … (للهيرو الرئيسي فقط)

## المرجع الكامل

راجع [`docs/CONTENT_ASSETS.md`](../../docs/CONTENT_ASSETS.md) — جدول كل خانة رفع (38 خانة).

## التحقق المحلي

```bash
npm run content:inventory
npm run content:core-100-inventory
```

يعرض خانات المحتوى الفارغة والجاهزة.
