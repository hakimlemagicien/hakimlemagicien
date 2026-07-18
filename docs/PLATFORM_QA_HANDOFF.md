# تقرير تسليم المنصة بالكامل — Hakim Coaching Platform

**إلى:** 🧪 QA Manager  
**من:** 💻 Platform Developer  
**التاريخ:** 2026-07-18  
**الحالة:** Ready for QA  
**نتيجة البناء:** `npm run build` ✅ ناجح  

---

## 1. ملخص تنفيذي

تم تنفيذ دفعة كبيرة من ميزات منصة الأعضاء (`/app`) تشمل:

| # | المجال | الحالة |
|---|--------|--------|
| 1 | التنقل + قسم الأدوات (Tools Hub) | ✅ جاهز |
| 2 | حاسبة السعرات الحرارية الذكية | ✅ جاهز |
| 3 | تايمر التدريبات (Interval Timer) | ✅ جاهز |
| 4 | اكتشف (Discover) + CMS seed | ✅ جاهز |
| 5 | الملف الشخصي (Account Center) | ✅ جاهز |
| 6 | التغذية (Nutrition) | ✅ جاهز |
| 7 | التقدم (Progress) | ✅ جاهز |
| 8 | متابعة الماء (Water) | ✅ جاهز |
| 9 | الرئيسية (Home Dashboard) | ✅ جاهز |
| 10 | الأداء والبنية التحتية | ✅ جاهز |

**خارج النطاق (لم تُعدَّل):** Landing (ما عدا تحسينات أداء)، Quiz، Admin — إلا ما ذُكر صراحة تحت الأداء.

---

## 2. خريطة التنقل الجديدة

### الشريط السفلي (Mobile)

| الترتيب | التبويب | السلوك |
|---------|---------|--------|
| 1 | برنامجي | يفتح Daily Hub Overlay |
| 2 | اكتشف | `/app/discover` |
| 3 | الرئيسية (وسط) | `/app` |
| 4 | **الأدوات** | يفتح Tools Hub Overlay |
| 5 | الملف الشخصي | `/app/profile` |

### Tools Hub

عند الضغط على «الأدوات»:

| الأداة | الفتح |
|--------|-------|
| حاسبة السعرات الحرارية | Large Bottom Sheet (عالمي) |
| تايمر التدريبات | صفحة `/app/tools/timer` |

### Program Hub (برنامجي)

بطاقات: البرنامج · التغذية · التقدم · مكتبة التمارين (حسب الصلاحيات).

### Desktop Sidebar

روابط مباشرة: الرئيسية · برنامجي · مكتبة التمارين · اكتشف · التغذية · التقدم · حاسبة السعرات (Sheet) · المؤقت · الملف الشخصي.

---

## 3. المسارات (Routes) — ما أُضيف / تغيّر

| المسار | التغيير | النوع |
|--------|---------|-------|
| `/app` | إعادة بناء لوحة الرئيسية | معدّل |
| `/app/discover` | Feed مجلة | معدّل كلياً |
| `/app/discover/search` | بحث + فلاتر | **جديد** |
| `/app/discover/saved` | المحتوى المحفوظ | **جديد** |
| `/app/discover/category/$slug` | فئة موحدة | **جديد** |
| `/app/discover/$slug` | تفاصيل المحتوى | **جديد** |
| `/app/profile` | مركز الحساب (13 قسماً) | معدّل كلياً |
| `/app/nutrition` | تجربة تغذية موسّعة | معدّل |
| `/app/nutrition/meal` | تفاصيل الوجبة | معدّل |
| `/app/nutrition/shopping` | قائمة التسوق | **جديد** |
| `/app/nutrition/progress` | تقدم التغذية | **جديد** |
| `/app/nutrition/alternatives` | بدائل الوجبات | **جديد** |
| `/app/progress` | لوحة التقدم | معدّل |
| `/app/tools/calories` | Deep link → يفتح Sheet | معدّل (لم يعد نموذج إدخال) |
| `/app/tools/timer` | Interval Timer كامل | **جديد / استبدال** |
| `/app/water` | **محذوف** — الماء عبر Sheet عالمي | محذوف |
| `/app/program/workout/*` | تحسينات اللاعب | معدّل |
| `/app/exercises` | Skeletons بدل Spinner | معدّل |

---

## 4. تفاصيل الميزات للاختبار

### 4.1 الرئيسية `/app`

**ما أُضيف/عدّل:**
- Skeleton لوحة التحكم (`HomeDashboardSkeleton`)
- بطاقة التغذية الشخصية
- نتائج الأعضاء / قصص (`HomeMemberResults`)
- Sticky upgrade footer للأعضاء المجانيين
- تكامل ماء مدمج (Widget + فتح Sheet)
- تحسينات Premium preview + OptimizedImage
- Hub membership gates

**اختبار:**
- [ ] تظهر المحتويات الأساسية بسرعة بدون Spinner ملء الشاشة
- [ ] العضو المجاني يرى CTA ترقية مناسب
- [ ] العضو المدفوع لا يرى بوابات خاطئة
- [ ] فتح الماء من الرئيسية يعمل
- [ ] لا كسر للتخطيط على شاشات صغيرة (390×844)

---

### 4.2 اكتشف `/app/discover`

**الوصف:** تجربة مجلة مستقلة عن بيانات البرنامج الشخصي.

**المسارات الفرعية:** feed · search · saved · category · detail

**أنواع المحتوى:** مقال · فيديو · وصفة · قصة نجاح · تحدي · نصيحة يومية · تحديث منصة

**ترتيب الأقسام (ثابت):**
1. Header → 2. بحث → 3. Featured → 4. فئات → 5. نصيحة يومية → 6. فيديوهات → 7. مقالات → 8. قصص نجاح → 9. تحديات → 10. وصفات → 11. حديث

**قاعدة البيانات:**  
`supabase/migrations/20260718100000_discover_content_cms.sql`  
(الجداول جاهزة؛ الواجهة تعمل حالياً على Seed)

**اختبار:**
- [ ] ترتيب الأقسام مطابق
- [ ] الأقسام الفارغة مخفية
- [ ] البحث debounce ~400ms + فلاتر
- [ ] حفظ / إلغاء حفظ
- [ ] محتوى Premium مقفول + CTA ترقية
- [ ] قصص النجاح تظهر فقط مع موافقة + تنويه
- [ ] لا تظهر بيانات برنامج المستخدم الشخصي
- [ ] Offline banner عند انقطاع الشبكة
- [ ] RTL + Reduce Motion على الكاروسيل

**تقرير تفصيلي:** `docs/DISCOVER_REPORT.md`

---

### 4.3 الملف الشخصي `/app/profile`

**الوصف:** مركز حساب موحّد بـ 13 قسماً بالترتيب المعتمد.

| # | القسم |
|---|-------|
| 1 | Header |
| 2 | Profile Hero (صورة · اسم · بريد · تاريخ · شارة · كود عضو) |
| 3 | Membership Card |
| 4 | المعلومات الشخصية |
| 5 | الأهداف والبرنامج |
| 6 | ملخص النشاط |
| 7 | الحساب والأمان |
| 8 | إعدادات التطبيق |
| 9 | الإشعارات |
| 10 | الخصوصية والبيانات |
| 11 | مركز الدعم |
| 12 | عن المنصة |
| 13 | تسجيل الخروج |

**قواعد حرجة:**
- عند فشل تحميل العضوية → **«تعذر التحقق»** وليس Free
- تعديل البيانات عبر Sheets وليس inline
- حذف الحساب: تأكيد متعدد الخطوات

**اختبار:**
- [ ] ترتيب الأقسام
- [ ] رفع / حذف الصورة (نوع · حجم)
- [ ] تعديل المعلومات + validation
- [ ] خطأ العضوية لا يعرض Free
- [ ] تغيير كلمة المرور / البريد
- [ ] تسجيل الخروج من كل الأجهزة
- [ ] إعدادات الصوت/الاهتزاز تُحفظ محلياً

**تقرير تفصيلي:** `docs/PROFILE_REPORT.md`

---

### 4.4 الأدوات — حاسبة السعرات (Bottom Sheet)

**المسار المنطقي:** الأدوات → حاسبة السعرات الحرارية  
**الفتح:** Large Bottom Sheet (ليس تبويب Bottom Nav)

**المبدأ:** لا إعادة إدخال بيانات — قراءة من Profile + Training Profile فقط.

**المعادلة:** Mifflin-St Jeor  
**النشاط:** 1.2 / 1.375 / 1.55 / 1.725 / 1.9  
**الأهداف:** cut −300 · maintain 0 · bulk +300  
**الماكروز:** بروتين 2g/kg · دهون 25% · كربوهيدرات الباقي

**حالات يجب اختبارها:**
- [ ] فتح من Tools Hub (موبايل) ومن Sidebar (ديسكتوب)
- [ ] بيانات مكتملة → نتيجة تلقائية خلال أقل من ثانية
- [ ] بيانات ناقصة → Missing Data + «استكمال بياناتي» → Profile
- [ ] تعديل البيانات داخل الحاسبة **ممنوع**
- [ ] معاينة هدف مختلف لا تغيّر الهدف الفعلي
- [ ] شارة «معاينة» عند اختلاف الهدف
- [ ] تنبيه عند وجود خطة غذائية فعالة
- [ ] «حفظ النتيجة كمرجع» فقط — لا تعديل برنامج غذائي
- [ ] Deep link `/app/tools/calories` يفتح الـ Sheet
- [ ] Self-checks: 6/6 (منطق الحساب)

**تقرير تفصيلي:** `docs/CALORIE_CALCULATOR_REPORT.md`

---

### 4.5 الأدوات — تايمر التدريبات `/app/tools/timer`

**النوع:** صفحة مستقلة كاملة (ليس Sheet صغير)

**الوظيفة الأساسية:** Interval Timer فقط (لا Stopwatch/Countdown في v1)

**القوالب الجاهزة:**

| القالب | عمل | راحة | جولات | استعداد |
|--------|-----|------|-------|---------|
| Tabata | 20s | 10s | 8 | 5s |
| HIIT للمبتدئين | 40s | 20s | 10 | 5s |
| Fat Burn | 45s | 15s | 12 | 5s |
| Boxing | 3m | 1m | 12 | 10s |

**منطق الوقت:** timestamps (`phaseEndTime`) وليس `setInterval` تنازلي فقط  
**Wake Lock:** عند التوفر  
**صوت + اهتزاز:** اختياريان ولا يعطلان الجلسة

**اختبار:**
- [ ] Tabata افتراضي عند أول فتح (بدون بدء تلقائي)
- [ ] اختيار قالب يحدّث القيم دون بدء
- [ ] IDLE → PREPARING → WORK ⇄ REST → COMPLETED
- [ ] لا راحة بعد آخر جولة عمل
- [ ] Pause / Resume يحفظ الوقت بدقة
- [ ] العودة من الخلفية تصحّح المرحلة والجولة
- [ ] تخطي المرحلة / إنهاء مع Dialog تأكيد
- [ ] الرجوع أثناء جلسة نشطة → تأكيد الخروج
- [ ] مؤقت مخصص: حفظ + بدء دون حفظ
- [ ] الصوت والاهتزاز قابلان للإيقاف
- [ ] Self-checks: 8/8

**تقرير تفصيلي:** `docs/INTERVAL_TIMER_REPORT.md`

---

### 4.6 التغذية `/app/nutrition`

**ما أُضيف:**
- إعادة بناء الشاشة الرئيسية للتغذية
- تفاصيل الوجبة
- قائمة التسوق `/app/nutrition/shopping`
- تقدم التغذية `/app/nutrition/progress`
- بدائل الوجبات `/app/nutrition/alternatives`
- طبقة تجربة + تخزين محلي للخطة (`nutrition-experience`, `nutrition-plan-storage`)

**اختبار:**
- [ ] فتح التغذية من Program Hub
- [ ] عرض الوجبات / الأيام
- [ ] تفاصيل وجبة
- [ ] قائمة التسوق تعمل
- [ ] شاشة التقدم الغذائية
- [ ] البدائل (إن وُجدت خطة)
- [ ] احترام صلاحيات العضوية (nutrition_plan)
- [ ] RTL + skeletons

---

### 4.7 التقدم `/app/progress`

**ما أُضيف:**
- أقسام Progress موحّدة (`ProgressSections`, `ProgressShared`)
- تخزين محلي + تجربة مجمّعة (`progress-storage`, `progress-experience`)
- ربط ملخص النشاط من الملف الشخصي بنفس المصادر

**اختبار:**
- [ ] فتح من Program Hub
- [ ] عرض الإحصائيات / القياسات
- [ ] حفظ القياسات محلياً
- [ ] الاتساق مع أرقام Activity في Profile
- [ ] حالات التحميل والفراغ

---

### 4.8 الماء (Water)

**التغيير الجوهري:** حذف `/app/water` — الأداة أصبحت Sheet عالمي عبر `WaterProvider`.

**المكونات:**
- `WaterBottomSheet`
- `WaterCompactWidget` (الرئيسية / أماكن أخرى)
- `WaterContext` + `water-storage`
- Feedback / Undo toast / Goal celebration

**اختبار:**
- [ ] فتح الماء من الرئيسية / التكاملات
- [ ] إضافة كميات سريعة + مخصص
- [ ] Undo يعمل
- [ ] احتفال عند الوصول للهدف
- [ ] المسار `/app/water` لم يعد موجوداً (404 أو redirect حسب الراوتر)
- [ ] لا يظهر الماء كصفحة في Bottom Nav

---

### 4.9 التمارين والتمرين اليومي

**ما عُدّل:**
- مكتبة التمارين: skeletons بدل spinner
- `ExerciseThumbnail` → OptimizedImage / Skeleton
- Workout player / complete screen / motivation CTA
- تكامل ماء بعد إكمال التمرين (اختياري)

**اختبار:**
- [ ] فتح مكتبة التمارين (مع/بدون صلاحية)
- [ ] تحميل الكتالوج بدون spinner ملء الشاشة
- [ ] إكمال تمرين → شاشة الإكمال
- [ ] CTA التحفيز يعمل

---

### 4.10 الأداء والبنية التحتية

**السياسة الرسمية:** `docs/PERFORMANCE.md` (إلزامية في AGENTS.md)

| عنصر | الملف |
|------|-------|
| OptimizedImage | `src/components/ui/optimized-image.tsx` |
| SectionSkeleton | `src/components/ui/section-skeleton.tsx` |
| React Query defaults | `src/lib/performance/query-client.ts` |
| Image optimizer script | `scripts/optimize-images.mjs` |
| Vite manualChunks | `vite.config.ts` |

**أهداف:** Lighthouse Performance ≥ 90 على الصفحات الرئيسية · FCP < 1.8s · LCP < 2.5s · CLS < 0.1

**اختبار أداء:**
- [ ] Landing `/` — lazy sections + LCP
- [ ] `/app` — skeletons ثم محتوى
- [ ] `/app/discover` — صور كسولة + لا preload فيديو
- [ ] `/app/exercises` — list skeleton
- [ ] لا Full-screen spinner على الشاشات الجديدة

**تقرير تفصيلي:** `docs/PERFORMANCE_REPORT.md`

---

## 5. قاعدة البيانات / Migrations

| Migration | الغرض | ملاحظة QA |
|-----------|-------|-----------|
| `20260718100000_discover_content_cms.sql` | جداول Discover CMS + RLS | تطبيق على Staging قبل Production؛ الواجهة تعمل على Seed حالياً |

لا يوجد جدول Supabase للحاسبة أو التايمر في v1 (localStorage فقط).

---

## 6. التخزين المحلي (localStorage Keys)

| المفتاح | الاستخدام |
|---------|-----------|
| `hakim.calorie-calculator.refs.v1:{userId}` | نتائج الحاسبة كمرجع |
| `hakim_interval_timer_settings` | آخر إعداد تايمر |
| `hakim_interval_timer_presets` | مؤقتات مخصصة |
| Discover storage | بحث حديث · حفظ · إعجاب |
| Profile settings | صوت · اهتزاز · إشعارات |
| Water / Progress / Nutrition plan | حالات يومية وتقدم |

---

## 7. الملفات الرئيسية حسب المجال

### أدوات
```
src/components/platform/shared/ToolsHubOverlay.tsx
src/components/platform/tools/ToolsContext.tsx
src/components/platform/tools/CalorieCalculatorSheet.tsx
src/hooks/useCalorieCalculator.ts
src/lib/platform/calorie-calculator.ts
src/lib/platform/calorie-calculator-storage.ts
src/components/platform/timer/*
src/hooks/useIntervalTimer.ts
src/lib/platform/timer/*
src/routes/_platform/app/tools/calories.tsx
src/routes/_platform/app/tools/timer.tsx
```

### اكتشف
```
src/components/platform/discover/*
src/hooks/useDiscoverExperience.ts
src/lib/platform/discover-content.ts
src/lib/platform/discover-storage.ts
src/routes/_platform/app/discover*
supabase/migrations/20260718100000_discover_content_cms.sql
```

### ملف شخصي
```
src/components/platform/profile/*
src/hooks/useProfileExperience.ts
src/lib/platform/profile-*.ts
src/routes/_platform/app/profile.tsx
```

### تغذية / تقدم / ماء / رئيسية
```
src/components/platform/nutrition/*
src/components/platform/progress/*
src/components/platform/water/*
src/components/platform/home/*
src/hooks/useNutritionPlan.ts
src/hooks/useProgressExperience.ts
src/lib/platform/nutrition-*.ts
src/lib/platform/progress-*.ts
src/lib/platform/water-storage.ts
```

### Shell / Nav
```
src/components/platform/layout/PlatformNav.tsx
src/components/platform/layout/PlatformShell.tsx
src/components/platform/shared/DailyHubOverlay.tsx
```

---

## 8. نتائج التحقق التقني (Developer)

| الفحص | النتيجة |
|-------|---------|
| `npm run build` | ✅ ناجح |
| Calorie calculator self-checks | ✅ 6/6 |
| Interval timer self-checks | ✅ 8/8 |
| تعديل `routeTree.gen.ts` يدوياً | ❌ ممنوع — يُولَّد تلقائياً |
| Landing / Quiz / Admin | لم تُعدَّل وظيفياً (أداء Landing فقط) |

---

## 9. أجهزة وبيئات مقترحة للاختبار

| البيئة | الأولوية |
|--------|----------|
| iPhone Safari (PWA + عادي) | عالية |
| Android Chrome | عالية |
| Desktop Chrome / Safari | متوسطة |
| شبكة بطيئة / Offline بعد التحميل | عالية |
| بدون صوت / بدون اهتزاز / بدون Wake Lock | متوسطة |
| عضو Free vs Paid | عالية |
| حساب ببيانات ناقصة في الملف الشخصي | عالية (حاسبة) |

---

## 10. قيود معروفة (v1)

1. **Discover CMS:** الواجهة على Seed؛ جداول Supabase جاهزة لكن تحتاج تعبئة + تبديل fetch.
2. **الحاسبة / التايمر:** لا مزامنة بين الأجهزة (localStorage).
3. **التايمر على iOS:** لا ضمان للصوت أثناء قفل الشاشة.
4. **الماء:** لا صفحة مستقلة؛ Sheet فقط.
5. **حذف الحساب:** تأكيد + تسجيل طلب — الحذف الخلفي الكامل قد يكون TBD.
6. **Analytics:** hooks جاهزة جزئياً؛ لا تسجل بيانات صحية خام في الحاسبة.
7. **لا يوجد Vitest في المشروع حالياً** — الاعتماد على self-checks + اختبار يدوي.

---

## 11. خطة اختبار QA المقترحة (أولوية)

### P0 — حرج قبل أي نشر
1. التنقل: Program Hub + Tools Hub + Bottom Nav
2. حاسبة السعرات: بيانات كاملة / ناقصة / معاينة / حفظ مرجع
3. التايمر: دورة كاملة + Pause + خلفية + لا راحة بعد آخر جولة
4. Profile: خطأ عضوية ≠ Free + تعديل بيانات
5. Membership gates على الرئيسية والتغذية واكتشف Premium
6. `npm run build` على بيئة CI/Staging

### P1 — مهم
7. Discover: feed · search · save · premium lock
8. Nutrition: meal · shopping · progress · alternatives
9. Progress + اتساق أرقام Profile
10. Water Sheet من الرئيسية
11. RTL على كل الشاشات الجديدة
12. Accessibility: 44px · VoiceOver/TalkBack أساسي · Reduce Motion

### P2 — تحسين
13. Lighthouse Performance على `/`, `/app`, `/app/discover`
14. Offline banners
15. Deep links: `/app/tools/calories`, `/app/tools/timer`
16. Custom timer presets persistence بعد refresh

---

## 12. تقارير تفصيلية مرافقة

| التقرير | المسار |
|---------|--------|
| Discover | `docs/DISCOVER_REPORT.md` |
| Profile | `docs/PROFILE_REPORT.md` |
| Calorie Calculator | `docs/CALORIE_CALCULATOR_REPORT.md` |
| Interval Timer | `docs/INTERVAL_TIMER_REPORT.md` |
| Performance | `docs/PERFORMANCE_REPORT.md` |
| سياسة الأداء | `docs/PERFORMANCE.md` |
| **هذا التقرير (موحّد)** | `docs/PLATFORM_QA_HANDOFF.md` |

---

## 13. بروتوكول التسليم

```
Platform Developer  →  QA Manager  →  (Bugfix)  →  Re-test  →  Sign-off
```

**بعد اجتياز QA:**
- تطبيق migration Discover على Staging ثم Production
- قياس Lighthouse على الصفحات الرئيسية
- تحديث الوثائق الرسمية عند أي تغيير في الحقيقة التقنية

---

## 14. الحالة النهائية

| البند | القيمة |
|-------|--------|
| Build | ✅ Pass |
| نطاق `/app` | موسّع وجاهز للاختبار |
| حماية Landing/Quiz/Admin | محترمة |
| الأولوية القصوى للاختبار | Tools (Calories + Timer) · Discover · Profile · Nav · Membership |

**➡️ Ready for Full Platform QA**
