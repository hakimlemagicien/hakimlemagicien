-- Exercise Video Asset Management (CEO-approved)
-- Shared placeholder strategy · status-driven playback · video metadata audit fields

ALTER TYPE public.exercise_media_status ADD VALUE IF NOT EXISTS 'review_required';
ALTER TYPE public.exercise_media_status ADD VALUE IF NOT EXISTS 'rejected';

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS video_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS video_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS video_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS video_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS video_file_size BIGINT,
  ADD COLUMN IF NOT EXISTS video_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS instructions_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS instructions_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS instructions_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS instructions_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS instructions_file_size BIGINT,
  ADD COLUMN IF NOT EXISTS instructions_mime_type TEXT;

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_video_file_size_check
    CHECK (video_file_size IS NULL OR video_file_size > 0);

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_instructions_file_size_check
    CHECK (instructions_file_size IS NULL OR instructions_file_size > 0);

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_video_version_check
    CHECK (video_version >= 1);

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_instructions_version_check
    CHECK (instructions_version >= 1);

COMMENT ON COLUMN public.exercises.video_path IS
  'Storage path for approved real video only (video_status = ready). NULL when placeholder — app resolves shared fallback.';

COMMENT ON COLUMN public.exercises.instructions_video_path IS
  'Storage path for approved instructions video only (instructions_status = ready). NULL when placeholder.';

-- Placeholder rows must not store per-exercise duplicate paths.
-- Real videos remain at exercises/{external_id}/exercise.mp4 (set via sync/migration scripts).
