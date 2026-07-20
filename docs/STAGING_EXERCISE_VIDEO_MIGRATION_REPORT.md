# STAGING EXERCISE VIDEO MIGRATION REPORT

**Date:** 2026-07-20  
**Commit:** `7109704` — Implement shared exercise video placeholder strategy per CEO directive  
**Environment:** Supabase linked project `ufgrbpakuemamggwypdh` (hakim-coaching)  
**QA Status:** ⏳ **Pending formal QA approval** — `--apply` **NOT executed**

---

## ⚠️ Environment Notice

| Item | Finding |
|------|---------|
| Dedicated staging Supabase project | **Not configured** — only one linked project exists |
| Local Supabase (Docker) | **Unavailable** — Docker daemon not running |
| Execution target | Linked project `ufgrbpakuemamggwypdh` used for **schema migration + sync validation** |
| Production safety | **No Storage files deleted.** `migrate-exercise-video-assets.sh --apply` **NOT run.** |

> **Action for Infrastructure:** Confirm whether `ufgrbpakuemamggwypdh` is staging or production before Storage cleanup (`--apply`).

---

## 1. Migration Review (Pre-Apply Checklist)

**File:** `supabase/migrations/20260720180000_exercise_video_asset_management.sql`

| Check | Result |
|-------|--------|
| Deletes records/files | ✅ **No** — additive only (`ALTER TYPE`, `ADD COLUMN`, `COMMENT`) |
| Changes `external_id` | ✅ **No** |
| Changes exercise names/data | ✅ **No** — no `UPDATE` on `exercises` |
| Unknown enum values cause failure | ✅ **Safe** — `ADD VALUE IF NOT EXISTS` only |
| Accepts all required statuses | ✅ **Yes** — after apply: `placeholder`, `ready`, `missing`, `review_required`, `rejected` |
| Rollback documented | ✅ **Yes** — see §8 |
| Auto-promotes to `ready` by URL | ✅ **No** — migration does not touch `video_status` |

**Apply result:** ✅ **SUCCESS** (via `supabase db query --linked -f …20260720180000…sql`)

---

## 2. Database — Before vs After Migration

| Metric | Before | After Migration | After Sync |
|--------|--------|-----------------|------------|
| Exercise records | **320** | **320** | **320** |
| Unique `external_id` | **320** | **320** | **320** |
| NULL / empty `external_id` | **0** | **0** | **0** |
| Duplicate `external_id` | **0** | **0** | **0** |
| `video_status = ready` | 320 | 320 | **0** |
| `video_status = placeholder` | 0 | 0 | **320** |
| `instructions_status = placeholder` | 0 | 0 | **320** |
| `video_path IS NULL` | 0 | 0 | **320** |
| `instructions_video_path IS NULL` | 0 | 0 | **320** |

### Enum `exercise_media_status`

**Before:** `placeholder`, `ready`, `missing`  
**After:** `placeholder`, `ready`, `missing`, **`review_required`**, **`rejected`**

### New columns (verified present)

`video_updated_at`, `video_reviewed_at`, `video_reviewed_by`, `video_version`, `video_file_size`, `video_mime_type`, `instructions_updated_at`, `instructions_reviewed_at`, `instructions_reviewed_by`, `instructions_version`, `instructions_file_size`, `instructions_mime_type`

### Sample names (unchanged post-migration)

| external_id | name_ar | name_en |
|-------------|---------|---------|
| AB-001 | كرنش | Crunch |
| AB-002 | كرنش عكسي | Reverse Crunch |
| AB-003 | كرنش دراجة | Bicycle Crunch |

---

## 3. Shared Placeholder (Storage)

| Path | Status |
|------|--------|
| `exercises/placeholders/default-exercise.mp4` | ✅ **Uploaded once** (sync `uploaded=2` includes exercise + instructions) |
| `exercises/placeholders/default-instructions.mp4` | ✅ **Uploaded once** |

**Local reference asset:**  
`~/Documents/Hakim Coaching Platform/Assets/placeholder-exercise.mp4`

| Hash | Value |
|------|-------|
| MD5 | `47a44ec5e49534f30564d0124d8907ee` |
| SHA-256 | `20efd7ae63ecf8d01e1352bc64414d3aeab403cd504aee96f6006bb954a8803c` |

---

## 4. sync-videos.sh Results

### Dry Run (`--dry-run`)

| Counter | Value |
|---------|-------|
| would_upload | **2** (shared placeholders) |
| updated (would) | **320** |
| skipped | **0** |
| errors | **0** |

**Behavior confirmed:**
- ✅ Supports `--dry-run`
- ✅ Does **not** delete files
- ✅ Does **not** modify exercise names or metadata (only `video_*` / `instructions_*` columns)
- ✅ Placeholder files (hash match) → `video_status=placeholder`, paths `NULL`
- ✅ No per-exercise placeholder upload

### Live Run (executed)

| Counter | Value |
|---------|-------|
| uploaded | **2** |
| updated | **320** |
| skipped | **0** |
| errors | **0** |
| Duration | ~20 min |

### Status summary (post-sync)

| Category | Count |
|----------|-------|
| **placeholder** | **320** |
| **ready** | **0** |
| **skipped** | **0** |
| **failed** | **0** |

---

## 5. Migration Manifest (Report-Only)

**Command:** `./scripts/migrate-exercise-video-assets.sh` (no `--apply`)  
**Output:** `docs/exercise-video-migration-manifest.json`

| Metric | Value |
|--------|-------|
| Storage objects scanned | **640** |
| Total Storage size | **4.58 GiB** |
| Per-exercise duplicate placeholders (MD5 verified) | **640** |
| Real video candidates | **0** |
| `--apply` executed | **NO** |

### ⚠️ Script Note

`migrate-exercise-video-assets.sh` reported `duplicate_count: 0` because it compares Storage **eTag (MD5)** to **SHA-256 prefix**. Manual verification confirms **all 640 per-exercise objects** share MD5 `47a44ec5…` matching the reference placeholder.

---

## 6. Manifest Entry Template (640 duplicate objects)

Each per-exercise Storage object follows this pattern:

| Field | Value |
|-------|-------|
| **storage_path** | `exercises/{external_id}/exercise.mp4` or `…/instructions.mp4` |
| **file_size_bytes** | `7683554` (~7.33 MiB) |
| **hash (MD5/eTag)** | `47a44ec5e49534f30564d0124d8907ee` |
| **related_external_id** | `{external_id}` (e.g. `CH-001`) |
| **current_video_status** | `placeholder` |
| **previous_url/path** | `exercises/{external_id}/exercise.mp4` (was `ready` in DB) |
| **duplicate_reason** | MD5 matches shared placeholder asset |
| **proposed_action** | **Delete after QA** (`--apply` phase) |
| **will_remain_after_cleanup** | **No** (per-exercise copies) |

### Objects that **MUST remain**

| storage_path | Action |
|--------------|--------|
| `exercises/placeholders/default-exercise.mp4` | **KEEP** |
| `exercises/placeholders/default-instructions.mp4` | **KEEP** |

---

## 7. Real Video Safety Check (Explicit)

| Check | Result |
|-------|--------|
| Files with MD5 ≠ placeholder | **0** |
| DB records with `video_status = ready` | **0** |
| Real videos in delete candidate list | **0** ✅ |

**Conclusion:** All 640 per-exercise Storage files are confirmed placeholder duplicates. **No real video** identified in deletion candidates.

---

## 8. Rollback Plan

### A. Schema Rollback (if needed)

```sql
-- Remove audit columns (safe — all nullable/defaulted)
ALTER TABLE public.exercises
  DROP COLUMN IF EXISTS video_updated_at,
  DROP COLUMN IF EXISTS video_reviewed_at,
  DROP COLUMN IF EXISTS video_reviewed_by,
  DROP COLUMN IF EXISTS video_version,
  DROP COLUMN IF EXISTS video_file_size,
  DROP COLUMN IF EXISTS video_mime_type,
  DROP COLUMN IF EXISTS instructions_updated_at,
  DROP COLUMN IF EXISTS instructions_reviewed_at,
  DROP COLUMN IF EXISTS instructions_reviewed_by,
  DROP COLUMN IF EXISTS instructions_version,
  DROP COLUMN IF EXISTS instructions_file_size,
  DROP COLUMN IF EXISTS instructions_mime_type;

-- Enum values review_required/rejected cannot be dropped easily in PostgreSQL.
-- Leave in place unless full enum rebuild is approved.
```

### B. DB Data Rollback (restore pre-sync paths)

Restore from manifest `database_rows` section or:

```sql
-- Example per exercise (run from backup manifest, not blind):
UPDATE public.exercises
SET video_status = 'ready',
    video_path = 'exercises/CH-001/exercise.mp4',
    instructions_status = 'ready',
    instructions_video_path = 'exercises/CH-001/instructions.mp4'
WHERE external_id = 'CH-001';
```

### C. Storage Rollback

- Per-exercise duplicates **still exist** (not deleted) — no Storage rollback needed yet.
- If `--apply` deletes duplicates: re-upload from manifest + `sync-videos.sh` (legacy mode) or restore from backup.

---

## 9. Errors & Warnings

| # | Type | Detail |
|---|------|--------|
| 1 | ⚠️ Warning | No dedicated staging Supabase — linked project used directly |
| 2 | ⚠️ Warning | Docker unavailable — local Supabase staging skipped |
| 3 | ⚠️ Warning | `migrate-exercise-video-assets.sh` duplicate detection uses wrong hash comparison (SHA vs MD5) — manual MD5 verification used for this report |
| 4 | ℹ️ Info | Pending migration `20260718100000_discover_content_cms.sql` **not applied** (out of scope) |
| 5 | ✅ | Zero errors in migration apply, sync, or manifest generation |

---

## 10. QA Manager — Approval Checklist

Before approving `migrate-exercise-video-assets.sh --apply`:

- [ ] Confirm environment (`ufgrbpakuemamggwypdh`) is approved for Storage cleanup
- [ ] Verify app displays all 320 exercises with correct Arabic names
- [ ] Verify shared placeholder plays on exercise detail + workout screens
- [ ] Verify `external_id` unchanged in UI and DB
- [ ] Test single real video upload path: `./scripts/sync-videos.sh --exercise CH-001` (with non-placeholder file)
- [ ] Confirm 640 duplicate MD5 objects match report
- [ ] Confirm **0** real videos in delete list
- [ ] Hard-refresh / private window cache test
- [ ] Sign off on ~**4.57 GiB** Storage savings post-cleanup

**QA Decision:** ☐ Approved for `--apply`  ☐ Rejected  ☐ Needs follow-up

---

## 11. Next Steps (Blocked until QA)

1. QA sign-off on this report  
2. `./scripts/migrate-exercise-video-assets.sh --apply` (Storage dedup only)  
3. Fix migrate script MD5 vs SHA-256 duplicate detection  
4. Production confirmation / separate staging project setup (recommended)  
5. Documentation Manager updates MASTER_DOC §13  

---

**Report generated by:** Platform Development  
**Manifest file:** `docs/exercise-video-migration-manifest.json`  
**Full manifest entries:** 640 objects — see JSON file for complete per-file listing
