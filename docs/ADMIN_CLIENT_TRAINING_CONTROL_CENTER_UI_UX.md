# Admin Client Training Control Center — UI/UX Handoff

**TASK:** `ADMIN_CLIENT_TRAINING_CONTROL_CENTER_UI_UX_DESIGN`  
**STATUS:** `PASS_WITH_GAPS`  
**IMPLEMENTATION:** not started (design + handoff only)  
**ENGINE / DB / POLICY:** unchanged

Visual review of the 10 screens: [Admin Training Control Center UX](/Users/hakimlemagicien/.cursor/projects/Users-hakimlemagicien-Documents-GitHub-hakimlemagicien/canvases/admin-training-control-center-ux.canvas.tsx)

---

## EXECUTIVE_SUMMARY_AR

مركز تحكم التدريب في ملف العميل يجب أن يُقرأ في ثوانٍ: البرنامج الحالي، هل النظام أم المدرب يديره، هل يوجد مجدول، هل يحتاج تدخلاً، وما التوصية. النظام يعمل تلقائياً؛ المدرب يتدخل فقط عند REVIEW / BLOCKED أو عند تغيير واعٍ. لا موافقة إلزامية على Auto Assign. الواجهة كثيفة، RTL أولاً، مع شريط أيام وصور تمارين لمعاينة سريعة دون Editor كامل.

---

## SCREENS_DESIGNED

| ID | Screen |
|----|--------|
| 01 | Client Training — Healthy Auto Managed |
| 02 | Client Training — Review Required (+ Blocked variant) |
| 03 | Client Training — Coach Managed |
| 04 | Client Training — Scheduled Change |
| 05 | Change Program — Template Selection (drawer) |
| 06 | Program Preview (days + exercise thumbs) |
| 07 | Assignment Confirmation + success toast |
| 08 | Program History (inline + full) |
| 09 | Training Review Inbox |
| 10 | Programs Operations strip on `/admin/programs` |

---

## CLIENT_TRAINING_WORKSPACE_DESIGN

**Route:** `/admin/clients/:clientId?tab=training`  
**Host:** `ClientTrainingWorkspace` (keep Client 360 header/tabs).

**Layout (desktop, `dir=rtl`):**

1. Optional attention banner (review/blocked only).
2. Status row: program name · `ACTIVE` · `AUTO MANAGED` | `COACH MANAGED` · started date.
3. Compact profile chips (goal, level, environment, days, equipment, quiz goal) — no extra fields.
4. Three equal cards: Scheduled (if any) | Current | Recommendation.
5. Week strip: day chips; selected day shows warmup / main / cardio with still thumbs.
6. History: last 4 events; «عرض التاريخ الكامل».

**Tablet:** stack scheduled → current → recommendation; day strip scrolls.  
**Mobile:** attention → current → sticky «تغيير البرنامج» → recommendation → history.

Do not show resolver JSON, UUIDs, or objective-signal dumps on the primary canvas. Move technical traces to «لماذا هذا البرنامج؟».

---

## CURRENT_PROGRAM_DESIGN

Large card, primary visual.

- Title: template `name_ar`
- Chips: level · environment · days
- Meta: المصدر تلقائي | مدرب · الإصدار vN · الحالة ACTIVE · ساري منذ
- Cover: first compound exercise thumb of day 1 (existing stage/Core 100 thumbs)
- Actions: عرض البرنامج · تغيير البرنامج · التاريخ
- If coach: badge `COACH MANAGED` + إدارة التدخل

---

## SYSTEM_RECOMMENDATION_DESIGN

Separate card, secondary.

- If current slug == recommended: «البرنامج الحالي يطابق توصية النظام» — no Apply.
- If different: CURRENT vs RECOMMENDED names + تطبيق التوصية | الإبقاء على الحالي
- «لماذا هذا البرنامج؟» drawer: Quiz Goal → Training Goal → Level → Environment → Days → Template. No JSON.

---

## CHANGE_PROGRAM_FLOW

Keep `assignStep` in the workspace; present as a **drawer**, not a new route.

1. Select — Recommended first, then filtered others (goal/level/env/days).
2. Preview — days + thumbs (`getExerciseStageListThumb`).
3. Confirm — current → new, when (default next safe session; immediate gated), management mode (auto default).
4. Success — toast + invalidate assignment queries. No deploy copy.

Confirm only for: change active, cancel scheduled, remove override, immediate switch.

---

## COACH_OVERRIDE_DESIGN

Persistent `COACH MANAGED`. Copy: لن يقوم النظام بتغيير البرنامج تلقائياً أثناء تفعيل إدارة المدرب.  
Return to auto: show recommendation, then confirm. Never silent.

---

## SCHEDULED_ASSIGNMENT_DESIGN

Two cards, never the same badge. Next shows start: الجلسة الآمنة التالية / date. Actions on next only: preview, change scheduled, cancel if backend allows.

---

## PROGRAM_HISTORY_DESIGN

Timeline: date, action (AUTO/COACH labels in Arabic), previous → new, actor. Snapshot read-only. Details disclosure for traces.

---

## REVIEW_INBOX_DESIGN

`/admin/notifications` — restyle `TrainingAssignmentReviewInbox`.

KPIs: Needs Review · Auto Assigned · Auto Updated · Blocked · Coach Managed.  
Filters: All / Needs Review / Auto Assigned / Auto Updated / Blocked / Reviewed.  
Row: client, goal·level·env·days, decision, program, short reason, time.  
Auto: View Client + Mark Reviewed. Review/Blocked: Review Client + Choose Program.

---

## PROGRAMS_DASHBOARD_DESIGN

`/admin/programs` stays template library. Add **Program Operations** strip above: active clients, auto, coach, scheduled, needs review, blocked. Honest unavailable if counts cannot be derived without new policy RPCs.

Template edit banner: التعديل لا يغيّر لقطات تعيين العملاء الحالية. Show version + published/draft; never a button that implies mass rewrite of snapshots.

---

## RTL_RESULT

All copy specified in Arabic first. Badges stay short Latin tokens (`ACTIVE`, `SCHEDULED`) with Arabic labels beside them in dense UI. Drawer, timeline, filters, tables: `dir=rtl`. Long template names wrap, never overflow chips.

---

## RESPONSIVE_RESULT

Desktop: 3-column program cards + horizontal day strip. Tablet: stacked cards, scroll strip. Mobile: current + attention first; primary actions 44px tap, no hover-only.

---

## EMPTY_ERROR_STATES

| State | UI |
|-------|-----|
| Loading | Skeleton matching 3 cards + day strip |
| No assignment | Empty: لا برنامج معيّن بعد + اختيار برنامج |
| No recommendation | Card: لا توصية Exact — اختيار يدوي |
| Review / Blocked | Banner + Choose Program |
| Scheduled | SCREEN 04 |
| Coach managed | SCREEN 03 |
| Resolver error | Banner + إعادة المحاولة + اختيار برنامج |
| Assignment failed | Toast + keep drawer open |
| No history | التاريخ سيظهر بعد أول تعيين |
| No notifications | صندوق المراجعات فارغ |

---

## Component map (implement later)

| UI block | Restyle | API (do not change contract) |
|----------|---------|------------------------------|
| Control center | `ClientTrainingWorkspace.tsx` | `getAdminClientAssignment`, `listAdminClientAssignments` |
| Status/source | `ClientTrainingAutoAssignPanel.tsx` | latest `training_assignment_reviews` |
| Recommendation | `TemplateRecommendationPanel.tsx` | `recommendTemplateForClient`; hide trace |
| Change/preview | existing `assignStep` | `assignAdminClientProgram`, `getAdminProgramTemplate` |
| Thumbs | `WeeklySchedulePreview` / template day preview | `getExerciseStageListThumb` |
| Inbox | `TrainingAssignmentReviewInbox.tsx` | `listTrainingAssignmentReviews` |
| Override | coach override panel | `applyCoachOverride` / progression `COACH_MANAGED` |

`PROGRAM_BOUNDARIES`: templates live on `/admin/programs`; snapshots live on client training.

---

## WHAT_CHANGED_AR

تصميم واجهة مركز التحكم + مواصفات تسليم. لا Backend، لا DB، لا سياسة Auto Assign.

---

## WHAT_I_SHOULD_REVIEW_AR

1. الكثافة: ثلاث بطاقات + شريط أيام دون إرهاق.  
2. Copy العربي لحالات Review vs Blocked.  
3. أن Auto Assign لا يظهر كفشل.  
4. أن Preview يعرض صوراً حقيقية للتمارين من المكتبة الحالية.

---

## KNOWN_GAPS_AR

- شريط KPIs في `/admin/programs` قد يحتاج تجميع قراءات موجودة؛ إن غاب العداد نعرض «غير متاح» وليس أرقاماً وهمية.  
- إلغاء المجدول فقط إذا الـ API الحالي يسمح بذلك بأمان.  
- صور التمارين ناقصة لبعض الـ IDs → placeholder محايد.

---

## RISKS_AR

- إعادة استخدام `ClientTrainingWorkspace` الضخم قد يسحب حقولاً تقنية للسطح إذا لم تُخفَ بـ progressive disclosure.  
- خلط Template edit مع Assignment في ذهن المدرب إن لم تُثبت حدود `PROGRAM_BOUNDARIES` في النسخ.

---

## NEXT_STEP_AR

تنفيذ الواجهة في Cursor على المكوّنات أعلاه فقط، مع إبقاء محرك التعيين كما هو.

---

## NEXT_HANDOFF

💻 Developer (Cursor) — implement UI restyle on existing assignment APIs. No engine/policy/migration work in that pass.
