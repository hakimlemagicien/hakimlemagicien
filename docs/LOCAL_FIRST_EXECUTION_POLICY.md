# MAAKFIT Local-First Execution Policy

## Status

This policy is active and is the default release workflow for MAAKFIT. Staging is disabled as a routine validation step and is used only when a task has an explicit, documented reason that cannot be validated safely with the local environment and a minimal Production smoke test.

The default execution path is:

`Local implementation → Focused tests → Local QA → Production build → Owner report and explicit approval → Production deploy → Minimal Production smoke test`

## Local-first rules

- Implement and validate application changes locally first.
- Use the local Supabase environment for database migrations and database-backed QA.
- Run focused tests for the changed behavior, then the official test suite when release risk requires it.
- Complete local browser QA for the affected customer and Admin flows.
- Produce a successful Production build before requesting deployment approval.
- Report the exact changes, test results, build result, remaining blockers, and expected Production impact to the owner.
- Do not deploy application code or mutate the Production database without explicit owner approval for that release.
- After approval, deploy only the reviewed scope and perform a small, focused Production smoke test.

## Staging policy

- Staging is not a mandatory release gate.
- Do not investigate, repair, restart, migrate, or smoke-test Staging by default.
- A Staging-only failure is not a launch blocker unless the same issue is reproduced locally or in Production, or the release explicitly depends on Staging-only infrastructure.
- Use Staging only when the release report documents why local validation is insufficient and the owner approves the additional work.
- Do not spend engineering time or credits on Staging infrastructure recovery unless it is explicitly authorized.

## Database release gate

Before any Production database mutation:

1. Create or verify an appropriate backup, restore point, or recovery path.
2. Record the current schema and migration state needed for rollback.
3. Apply the migration to local Supabase from a clean, reproducible state.
4. Run focused database, RPC, RLS, and application tests locally.
5. Run the Production application build.
6. Provide the owner with the migration scope, compatibility findings, rollback steps, and validation results.
7. Wait for explicit owner approval.
8. Apply only the approved migration set to Production.
9. Run a minimal Production smoke test and stop if any rollback condition is met.

Schema-cache notifications, environment repair helpers, or Staging recovery migrations are not automatically part of a Production release. Each migration must be justified by the Production contract before inclusion.

## Current Admin Exercise Media Manager V1 path

The approved validation sequence is:

1. Apply the Media Manager migration to local Supabase.
2. Authenticate locally as the approved Admin test account (`SH-005`).
3. Validate Draft creation.
4. Validate Preview without changing Published media.
5. Validate explicit Publish.
6. Validate Restore of the prior Published version.
7. Verify customer read isolation and Admin/Staff write authorization.
8. Run focused tests and the Production build.
9. Submit the owner report and wait for explicit Production approval.
10. After approval only: verify backup/recovery, apply the approved Production migration, deploy the approved code, and run a minimal Production smoke test.

## Required release report fields

Every implementation or deployment report should include:

- `EXECUTION_PATH`
- `STAGING_REQUIRED`
- `LOCAL_IMPLEMENTATION`
- `FOCUSED_TESTS`
- `LOCAL_QA`
- `BUILD_RESULT`
- `PRODUCTION_APPROVAL_REQUIRED`
- `PRODUCTION_DEPLOYED`
- `PRODUCTION_SMOKE`
- `P0_BLOCKERS`
- `P1_FOLLOWUPS`
- `CREDIT_COST`

## Production safety boundary

Local completion is not Production authorization. A passing local build or test suite does not grant permission to push, deploy, apply migrations, restart services, or modify Production data. The owner must approve the exact release after reviewing its report.

## Policy status

`MAAKFIT_LOCAL_FIRST_RELEASE_POLICY_ACTIVE`
