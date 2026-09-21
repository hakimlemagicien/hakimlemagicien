# Admin Exercise Media Manager V1

## Operational contract

`exercises.id` and `external_id` are immutable identity. Media publication never rewrites program templates, client program snapshots, workout logs, or analytics references.

The supported flow is:

1. Admin → Training → Exercise Library.
2. Select an existing exercise.
3. Upload video, thumbnail, instructional positions A/B/C, or anatomy image.
4. Uploads are stored under an immutable version path and attached to a Draft.
5. Preview the Draft as FREE, PLUS, or PRO.
6. Publish explicitly. The database switches the canonical `exercises` media references in one transaction.
7. The former Published snapshot is retained as Previous and can be restored.

If upload or publish validation fails, the currently published paths remain unchanged.

## Video guidance

- Up to 8 MB: optimized.
- 8–15 MB: accepted with a compression recommendation.
- Above 15 MB: accepted with a high-size warning.
- The 500 MB launch budget is advisory and never deletes or blocks content.

No transcoding is performed. V1 recommends MP4/H.264, 720p or 1080p, and approximately 30 fps.

## Security

Only Admin or Staff with `exercise.content_edit` can upload, stage, publish, or restore. Customers continue to read only the published `exercises` paths through the existing canonical resolver. Draft/version rows are not directly granted to authenticated customers.

## Release requirement

Follow the project-wide [Local-First Execution Policy](./LOCAL_FIRST_EXECUTION_POLICY.md).

Apply `20260921120000_admin_exercise_media_manager_v1.sql` to local Supabase first, then complete authenticated Admin Draft → Preview → Publish → Restore testing, authorization checks, focused tests, and the Production build. Submit the results to the owner and wait for explicit approval before any Production database or code change.

Staging is not required for this release by default. Staging schema-cache recovery work must not be continued unless a later task documents a release-specific need and receives explicit approval.

## Backup and rollback

Migration `20260921120000` is additive: it creates the version table, Media Manager RPCs, and authorized Staff storage policies. It does not rewrite existing exercise IDs, external IDs, template references, client snapshots, or canonical media during migration.

Before Production migration, retain a verified Production schema dump. If the release must be reverted before operational use, run `supabase/rollbacks/20260921120000_admin_exercise_media_manager_v1_rollback.sql`, then mark the migration history consistently. The rollback deliberately preserves the canonical fields already stored on `public.exercises`; it removes only the Media Manager schema objects.
