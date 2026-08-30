# MAAKFIT TRAINING PROGRAM STRATEGY MATRIX V1
# PHASE 0 — CEO REVIEW & CLOSURE DECISION

**Status:** `PHASE_0_CLOSED_APPROVED`  
**Previous Audit Status:** `PHASE_0_AUDIT_PASSED_WITH_OPEN_DECISIONS`  
**Audit artifact:** [`MAAKFIT_TRAINING_STRATEGY_PHASE_0_AUDIT.md`](./MAAKFIT_TRAINING_STRATEGY_PHASE_0_AUDIT.md)  
**Scope:** Architecture / Repository / Contract Audit Closure  
**Implementation:** NONE in Phase 0  
**Next Phase:** Phase 1 — Strategy Matrix Contracts & Profile Wiring

---

## 1. CEO DECISION

Phase 0 Repository & Contract Audit is formally:

`APPROVED AND CLOSED`

The audit established that MAAKFIT already contains a substantial and reusable Training Engine V2.

Therefore:

- DO NOT rebuild Training Engine V2.
- DO NOT create a parallel training engine.
- DO NOT replace the existing Prescription Engine.
- DO NOT replace Progression.
- DO NOT replace Volume.
- DO NOT replace Continuity.
- DO NOT replace Goal Intelligence.
- DO NOT replace Program Validation.
- DO NOT replace Assignment Snapshots.
- DO NOT replace the existing Client Loop.

The approved architectural direction is:

```
Client Training Profile
  → Training Program Strategy Matrix
  → Existing Training Engine V2
  → Validated Program
  → Assignment
  → Workout Execution
  → Performance Data
  → Adaptive Engine
  → Safe Program Adaptation
```

The Strategy Matrix is an orchestration/configuration layer **above** the existing V2 engines.

It is **not** a new training engine.

---

## 2. CORE ARCHITECTURE DECISION

The following architecture is now frozen for V1:

```
Client Profile
  ↓
Strategy Matrix
  ↓
Weekly Structure
  ↓
Goal / Muscle Priorities
  ↓
Movement Requirements
  ↓
Exercise Selection
  ↓
Prescription
  ↓
Validation
  ↓
Assignment Snapshot
  ↓
Workout
  ↓
Performance Data
  ↓
Adaptive Engine V2
  ↓
Program Adaptation
```

Coach intervention remains a separate controlled layer:

```
Coach Override Request
  ↓
Engine Review
  ↓
Impact Analysis
  ↓
Warnings / Alternatives
  ↓
Coach Confirmation
  ↓
Validated Versioned Program Update
```

Coach Overrides must never bypass safety, validation, history preservation, or Training Engine rules.

---

## 3. EXISTING SYSTEMS TO REUSE

Phase 0 confirmed that the following systems already exist and must be reused:

- Canonical Training Goals
- Exercise Library V2 metadata
- Movement Role taxonomy
- Exercise Eligibility
- Exercise Selection
- Prescription Engine
- Calibration
- Progression Engine
- Volume Engine
- Continuity Engine
- Goal Intelligence
- Program Generation
- Program Validation
- Immutable Assignment Snapshots
- Workout Runtime
- Set / Session Persistence
- Adaptive Decision Logs
- Client Loop
- Progress Explanation
- Membership Entitlements
- RLS boundaries

Do not duplicate any of these systems inside Strategy Matrix.

---

## 4. STRATEGY MATRIX RESPONSIBILITY

Strategy Matrix V1 is responsible for translating the client context into safe inputs for the existing generator.

Conceptually:

```
Client Profile
  → Strategy Matrix Resolution
  → ProgramGenerationContext
  → Existing Program Generator
```

Strategy Matrix may determine or constrain:

- canonical goal
- training level
- training frequency
- weekly structure
- training location
- available equipment
- session duration
- injuries / restrictions
- exercise eligibility
- Core 100 eligibility
- muscle priorities
- movement requirements
- regional targets
- locked/excluded exercises
- coach constraints

The Matrix must **not** perform progression or adaptive calculations that already belong to Training Engine V2.

---

## 5. PROFILE → ENGINE WIRING DECISION

Phase 0 identified that important profile information exists but is not consistently passed into program generation.

This must be corrected.

Phase 1 must establish **one** domain-level resolver such as:

`buildProgramGenerationContextFromProfile()`

or an equivalent appropriately named domain function.

UI components must not independently construct Training Engine strategy.

The resolver becomes the authoritative bridge between:

```
Quiz / Profile
  → Strategy Matrix
  → ProgramGenerationContext
```

This specifically eliminates current behavior such as:

- hardcoded `availableMinutes: 50`
- always using `trainingLevel: UNASSESSED`
- incomplete location mapping
- injuries collected but not used for selection
- generator context being assembled inside Admin UI

---

## 6. GOAL CONTRACT DECISION

Silent fallback to `FAT_LOSS` for an unknown/unmapped client goal is **not** acceptable.

Phase 1 must fail safely when a goal cannot be resolved.

No client may receive a FAT_LOSS program merely because their goal mapping is missing.

Male quiz goals currently requiring explicit canonical resolution include:

- `muscle`
- `fitness`
- `athletic`
- `shape`
- `gain`

Their final mapping must be explicit and testable before automated profile → program generation is allowed for those goals.

Do not hide unmapped goals through fallback behavior.

---

## 7. CORE 100 DECISION

MAAKFIT V1 will launch using:

`EXERCISE_LIBRARY_V1_CORE_100`

The existing 320-exercise catalog must **not** be deleted.

The architecture is:

| Layer | Scope |
|-------|-------|
| Full Exercise Catalog | Retained for future expansion |
| V1 Program Generation Pool | Core 100 only |

Core 100 should initially be implemented as a controlled/versioned configuration artifact unless a database requirement is proven necessary.

Do **not** introduce unnecessary database complexity merely to identify Core 100.

The system must remain expandable from 100 → 150 → 200 → 300+ without redesigning Strategy Matrix or Training Engine.

Before Core 100 becomes active in generation, automated validation must prove sufficient coverage for:

- male / female
- beginner / intermediate / advanced
- gym / home / mixed location
- major goals
- movement requirements
- muscle groups
- substitutions / equipment alternatives

---

## 8. TRAINING LOCATION DECISION

The client model must support:

- `GYM`
- `HOME`
- `BOTH`

Quiz `anywhere` / equivalent mixed-training choice must represent access to **both** environments.

`BOTH` does **not** mean every selected exercise must simultaneously be compatible with HOME and GYM.

It means the Strategy Matrix may construct an appropriate program using exercises available across the client's permitted environments.

Location compatibility must remain deterministic and testable.

---

## 9. EQUIPMENT DECISION

Location and equipment are separate constraints.

Example: HOME does not automatically imply no equipment.

A HOME client may have dumbbells, bands, bench, bodyweight only, or other supported equipment.

A GYM client may use the equipment available in the supported gym exercise pool.

Exercise selection must consider:

```
Location + Available Equipment + Goal + Level + Movement Requirements + Safety Constraints
```

—not location alone.

---

## 10. INJURY / SAFETY DECISION

Injury information collected from the client cannot remain display-only data.

It must become a real Training Strategy constraint.

Required direction:

```
Client injury / restriction
  → Safety mapping
  → Exercise eligibility / exclusion
  → Alternative selection
  → Validation
```

The system must fail safely if safe exercise coverage cannot be produced.

Do **not** silently ignore an injury merely to complete a program.

Do **not** allow Coach Override to bypass a hard safety restriction without an explicitly designed safety policy.

---

## 11. TRAINING DAYS DECISION

Training frequency is a first-class Strategy Matrix input.

V1 continues to support existing Training Engine frequencies where technically supported: **2–5 sessions/week**.

Preferred calendar days are an extension of weekly scheduling, not a reason to rebuild program generation.

The system must distinguish:

| Field | Meaning |
|-------|---------|
| `training_days_per_week` | Frequency (e.g. 3 sessions/week) |
| `preferred_training_days` | Calendar placement (e.g. Mon / Wed / Fri) |

The Strategy Matrix determines training structure.

Calendar scheduling determines when those sessions occur.

---

## 12. SESSION DURATION DECISION

Hardcoded 50-minute generation must not remain the long-term Strategy Matrix behavior.

Session duration becomes client/program context.

The generator must use existing duration estimation/trimming capabilities rather than duplicating duration logic.

Phase 1 should prepare the authoritative context contract.

Schema/UI changes should only be introduced in the appropriate implementation phase.

---

## 13. TRAINING LEVEL DECISION

Do not permanently generate every client as `UNASSESSED`.

Use existing `client_training_levels` and exercise experience mechanisms where available.

The system must support progression from UNASSESSED → BEGINNER → INTERMEDIATE (and future expansion) without changing Strategy Matrix architecture.

Training level affects selection/prescription through existing engines.

Strategy Matrix supplies the correct context; it does not recreate level logic.

---

## 14. AUTOMATION DIRECTION

The long-term approved experience is:

```
Client completes profile
  → Strategy Matrix resolves context
  → Program is generated
  → Program is validated
  → Valid program becomes eligible for assignment
```

MAAKFIT should not require the coach to manually design every normal client program.

However, implementation must remain **fail-closed**.

No invalid, incomplete, unsafe, unmapped, or unvalidated candidate may be silently assigned.

Coach review remains available for exceptional clients, conflicts, safety issues, requested changes, engine review cases, manual personalization, and future VIP/human coaching workflows.

---

## 15. COACH OVERRIDES

Coach Overrides are formally part of the target architecture.

They are **not** required to replace Strategy Matrix.

They sit above it.

Future workflow:

```
Client Request / Coach Decision
  → Proposed Override
  → Engine Review
  → Program Impact Analysis
  → Safety / Goal / Recovery warnings
  → Alternative recommendation where appropriate
  → Coach confirmation
  → Validation
  → New versioned assignment
```

Never destructively rewrite client training history.

Use the existing replacement/snapshot architecture.

---

## 16. LONG-TERM COACH PLATFORM EXTENSIBILITY

Strategy Matrix V1 must remain compatible with future expansion where external coaches can manage their own clients through MAAKFIT.

Future architecture may include:

```
Coach → Clients → Client Profiles → Strategy Matrix → Engine Recommendations
  → Coach Overrides → Monitoring → Adaptive Decisions → Progress
```

Do **not** build this marketplace/coach product now.

But Phase 1 architecture must not create assumptions that make multi-coach support impossible later.

---

## 17. FREE VS PAID TRAINING

Do not create separate Strategy Matrix engines for each subscription tier.

Existing entitlement boundaries remain authoritative.

| Tier | Training experience |
|------|---------------------|
| FREE | Controlled training preview |
| ESSENTIAL+ | Personalized Training Engine / assigned-program eligibility per entitlement |

The legacy/free lane must remain isolated from V2 paid progression.

Do not mix legacy universal `+10%` behavior into Training Engine V2.

---

## 18. NUTRITION BOUNDARY

Training Strategy Matrix must not mutate nutrition plans.

Training may produce signals such as `NUTRITION_REVIEW_REQUIRED`, but training logic must not directly rewrite calories, macros, meals, or nutrition assignments.

Training and Nutrition remain separate systems with controlled shared signals.

---

## 19. HISTORY & VERSIONING

The existing immutable/replacement assignment architecture is approved.

When a program materially changes:

- Old program → retained as historical assignment
- New program → new validated assignment/version

Historical sessions, sets, and adaptive decisions must remain attributable to the program under which they occurred.

Do **not** implement destructive in-place program history replacement.

---

## 20. PHASE 0 CRITICAL FINDINGS ACCEPTED

| Gap | Finding | Status |
|-----|---------|--------|
| G-001 | No named Strategy Matrix contract | Accepted — implementation gap |
| G-002 | Profile not fully wired into generation | Accepted |
| G-003 | Male goals unmapped; unsafe FAT_LOSS fallback | Accepted |
| G-004/G-005 | Weekly calendar / preferred-day semantics incomplete | Accepted |
| G-006 | BOTH location semantics require implementation | Accepted |
| G-007/G-018 | Core 100 not in generator scope | Accepted |
| G-009/G-010 | Coach Protected / Override workflow incomplete | Accepted |
| G-016 | Injury info not connected to exercise constraints | Accepted |
| G-017 | Training days not authoritative profile input | Accepted |

These are implementation gaps. They are **not** reasons to redesign Training Engine V2.

---

## 21. IMPLEMENTATION PHASES APPROVED

| Phase | Scope |
|-------|-------|
| **Phase 1** | Strategy Matrix Contracts & Profile Wiring |
| **Phase 2** | Weekly Calendar & Location Semantics |
| **Phase 3** | Core 100 & Exercise Safety Constraints |
| **Phase 4** | Assisted / Automated Program Assignment Flow |
| **Phase 5** | Coach Override Workflow |
| **Phase 6** | Hardening, QA & Launch Gates |

Do not combine all phases into one uncontrolled implementation.

Each phase requires: **PLAN → IMPLEMENT → TEST → REPORT → REVIEW → APPROVAL → NEXT PHASE**

---

## 22. PHASE 1 PRIORITY

Phase 1 must focus only on the foundation required by every later phase.

**Primary objective:** Create the authoritative Strategy Matrix contract and the authoritative Profile → `ProgramGenerationContext` bridge.

Phase 1 must reuse existing engines.

It must **not** prematurely implement:

- full Coach Override UI
- coach marketplace
- nutrition changes
- major workout UI redesign
- new progression / volume / prescription engines
- Production rollout

---

## 23. IMPLEMENTATION SAFETY RULE

Before changing code in every phase:

1. Inspect current implementation.
2. Identify exact reusable components.
3. Identify affected contracts.
4. Implement the smallest compatible change.
5. Add/update tests.
6. Run relevant test suites.
7. Run build.
8. Document changed files.
9. Document migrations if any.
10. Document known risks.
11. Stop at the phase boundary.

No phase may silently expand its own scope.

---

## 24. REPORTING CONTRACT

Every implementation phase must return a Markdown report.

**Required naming pattern:** `MAAKFIT_TRAINING_STRATEGY_PHASE_X_REPORT.md`

Each report must contain at minimum:

1. Executive Summary
2. Scope
3. Approved Decisions Applied
4. Files Changed
5. Database Changes
6. Contracts Added/Changed
7. Implementation Details
8. Reused Existing Systems
9. Tests Added/Updated
10. Test Results
11. Build Result
12. Regression Checks
13. Training/Nutrition Boundary Check
14. Legacy/V2 Isolation Check
15. Security/RLS Impact
16. Known Risks
17. Open Blockers
18. Acceptance Criteria
19. Final Status

No phase should be considered closed from a chat response alone. The `.md` report is the review artifact.

---

## 25. PHASE 0 ACCEPTANCE

Phase 0 successfully established repository architecture, Training Engine V2 capabilities, database contracts, frontend integration, reusable systems, Strategy Matrix orchestration gap, profile wiring gaps, goal contract risks, weekly scheduling gaps, exercise-library launch-scope gap, Coach Override gap, entitlements boundary, Training/Nutrition boundary, legacy/V2 separation, and implementation phase sequence.

**No further repository audit is required before Phase 1.**

Do **not** repeat Phase 0.

---

## 26. FINAL PHASE 0 STATUS

| Decision | Value |
|----------|-------|
| Phase 0 status | `PHASE_0_CLOSED_APPROVED` |
| Architecture direction | `EXTEND_EXISTING_TRAINING_ENGINE_V2` |
| Strategy Matrix role | `CONFIGURATION_AND_ORCHESTRATION_LAYER` |
| Parallel Training Engine | `FORBIDDEN` |
| Core exercise launch scope | `CORE_100_APPROVED_DIRECTION` |
| Full exercise catalog | `RETAIN_FOR_FUTURE_EXPANSION` |
| Coach Overrides | `APPROVED_ARCHITECTURAL_LAYER` |
| Training/Nutrition separation | `REQUIRED` |
| History preservation | `REQUIRED` |
| Next implementation phase | `PHASE_1_STRATEGY_MATRIX_CONTRACTS_AND_PROFILE_WIRING` |

---

## 27. EXECUTION INSTRUCTION

This document is the governing decision for subsequent Training Program Strategy Matrix work.

- Do not implement additional Phase 0 work.
- Do not reinterpret the approved architecture.
- Do not redesign Training Engine V2.
- Phase 1 will be issued as a separate execution order.
- **No implementation is authorized by this closure document itself.**

---

## FINAL STATUS

**`PHASE_0_CLOSED_APPROVED`**

Phase 0 is complete.

Training Engine V2 is the existing engine foundation.

Training Program Strategy Matrix V1 will be built as a controlled orchestration/configuration layer above it.
