# Phase 10 — Visual Evidence (تحديث عيب Admin Visibility)

**البيئة:** `http://127.0.0.1:5173/admin/programs` ضد Local Supabase  
**Production/Staging:** لم يُمسا في هذا العيب

| File | Content |
|------|---------|
| `04-admin-programs-real-after-fix.png` | الصفحة الحقيقية — Canonical V1 **37/37** |
| `05-admin-detail-sample.png` | تفاصيل قالب من القائمة الحقيقية |
| `06-admin-filter-fat-loss.png` | بحث/تصفية |
| `07-detail-fat-loss.png` | عينة Fat Loss |
| `08-detail-06a.png` | عينة Muscle 06A |
| `09-detail-06b.png` | عينة Muscle 06B / 5 أيام |
| `10-detail-glute.png` | عينة Glute |
| `11-admin-filters-gym-intermediate.png` | فلاتر صالة + متوسط |

**تشغيل صحيح للتطوير المحلي:**

```bash
npm run dev:local -- --port 5173 --host 127.0.0.1
```

تأكد أن طلبات `admin_list_program_templates` تذهب إلى `http://127.0.0.1:54321` وليس Production/Staging.
