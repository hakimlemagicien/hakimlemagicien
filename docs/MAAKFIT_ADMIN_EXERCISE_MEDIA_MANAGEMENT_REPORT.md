# MAAKFIT ADMIN — EXERCISE MEDIA MANAGEMENT REPORT

**Branch:** `feat/admin-command-center-foundation`  
**Environment:** Staging only (`dxerwrdpcflpnjvsnrjq`)  
**Runtime SHA:** `9f9b353`

---

MEDIA_ARCHITECTURE_AUDIT: REUSE — `exercises.video_path` / `video_status` / `instructions_video_path` / `instructions_status` / `thumbnail_path` + bucket `exercise-media`. Canonical objects: `exercises/{ID}/exercise.mp4`, `exercises/{ID}/instructions.mp4`, `exercises/{ID}/thumbnail.{webp|jpg|png}`.

EXERCISE_VIDEO_UPLOAD: YES (Admin «إدارة الوسائط» + Storage upsert + `admin_replace_exercise_media`)  
EXERCISE_VIDEO_REPLACE: YES (confirm → upload → RPC; Staging QA on AB-024)  
INSTRUCTIONS_VIDEO_UPLOAD: YES (independent `instructions_status`)  
THUMBNAIL_UPLOAD: YES  
THUMBNAIL_REPLACE: YES  
THUMBNAIL_LIST_DISPLAY: YES (64px lazy signed URLs; AB-024 visible in list)  
THUMBNAIL_FALLBACK: YES («لا توجد صورة» + `onError`; AB-023 row intact)  
VIDEO_STATUS_SYNC: YES — `ready` only after successful upload then RPC; thumbnail replace did not change `video_status`  
EXTERNAL_ID_UNCHANGED: YES (`AB-024` before/after; identity guard in RPC)  
EXERCISE_NAME_UNCHANGED: YES (`Cable Wood Chop` / تقطيع خشب كيبل)  
ASSIGNMENTS_UNCHANGED: YES (RPC updates media columns only)  
PROGRESS_LOGS_UNCHANGED: YES  
MATRIX_ENGINE_CHANGED: NO  
CORE_100_CHANGED: NO  
STORAGE_SECURITY: YES — path must match `{external_id}`; arbitrary `exercises/CH-001/...` for AB-024 rejected (`invalid_media_path`)  
ADMIN_ONLY_UPLOAD: YES — client session RPC → `forbidden`  
DESKTOP_QA: PASS (1440/table thumbs + media panel)  
TABLET_QA: PASS (1024 table, identity visible)  
MOBILE_QA: PASS (390 card list after CSS fix; no videos in list)  
RTL_QA: YES  
TEST_RESULT: PASS (`npx tsx src/lib/admin/admin-exercise-media.test.ts`)  
BUILD_RESULT: PASS (`npm run build -- --mode staging` at import-fix SHA)  
DATABASE_MIGRATION_REQUIRED: YES (RPC only; no new columns)  
MIGRATION_APPLIED: YES on Staging `20260901040000_admin_exercise_media_replace.sql` — Production not applied  

FILES_CHANGED: `ExerciseLibraryManager.tsx`, `ExerciseMediaPanel.tsx`, `ExerciseListThumb.tsx`, `admin-exercise-media*.ts`, `exercise-media.ts`, `styles.css`, `20260901040000_admin_exercise_media_replace.sql`, tests, this report  

COMMIT_SHA: `9f9b353` (media feature `a6a5c34` + detail-open fix `2c95ac1` + mobile cards `9f9b353`)  
PUSH_RESULT: SUCCESS → `origin/feat/admin-command-center-foundation`  
STAGING_DEPLOY: YES (workflow_dispatch; never `--prod`)  
STAGING_ALIAS: `https://staging.hakimlemagicien.com` → `https://hakimlemagicien-5fym9jv21-hakim-le-magicien.vercel.app` (bundle `admin-command-center-WSPdekWQ.js` then successor on `9f9b353`)  
AUTHENTICATED_QA: PASS as Staging Admin — list thumbs, search `AB-024`, open details, media panel (thumb + exercise video + instructions), statuses جاهز/جاهزة, identity fields unchanged  
PRODUCTION_TOUCHED: NO  
MAIN_TOUCHED: NO  

KNOWN_ISSUES:
- Thumbnail read-only path in the panel currently prints the default `.webp` canonical string even when the stored object is `.png` (list still loads the real `thumbnail_path`).
- Staging GitHub alias step often fails; alias was set with Vercel CLI after each preview.
- File picker in Admin was not driven from the browser agent (hidden input). Upload/replace was verified with the same Admin session APIs the UI uses (Storage + RPC), then confirmed in the UI.
- Staging QA used **AB-024** (placeholder → 1s test clip). Do not copy that clip to Production.
- Coach role remains `exercise.read` only; upload requires `exercise.content_edit` (super_admin).
- RPC does not HEAD Storage; `ready` is set only if the client calls RPC after a successful upload.

FINAL_DECISION: MAAKFIT_ADMIN_EXERCISE_MEDIA_MANAGEMENT_CLOSED
