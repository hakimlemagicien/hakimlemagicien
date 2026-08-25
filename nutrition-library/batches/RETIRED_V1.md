# توقيف مكتبة التغذية V1

هذه المجلدات (`001-020`, `021-060`, `061-100`, `101-300`) هي **أرشيف V1** فقط.

**لا تستوردها** إلى `src/lib/platform/data/` ولا تشغّل سكربتات الـ upsert القديمة.

المصدر المعتمد من 2026-08-22:

- الحزم: `Nutrition Library/source/nutrition_v2_MEAL-*`
- التشغيل: `src/lib/platform/data/nutrition-library-v2.json`
- المرجع: `nutrition-library/SOURCE.json`
- قاعدة البيانات: `scripts/upsert-meal-library-v2.sql`

الهوية تبقى `MEAL-NNN`. المحتوى والنوع والصورة والقيم الغذائية أصبحت V2 على نفس المفاتيح.
