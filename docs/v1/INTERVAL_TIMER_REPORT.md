# Interval Timer — Delivery Report

## Route

- **Path:** `/app/tools/timer`
- **Entry:** Tools hub → «تايمر التدريبات»
- **Type:** Standalone full page (not Bottom Sheet)

## Architecture

| Layer | Files |
|-------|--------|
| State machine | `src/lib/platform/timer/interval-timer-engine.ts` |
| Presets | `src/lib/platform/timer/presets.ts` |
| Storage | `src/lib/platform/timer/interval-timer-storage.ts` |
| Audio / vibration / wake lock | `timer-audio.ts`, `timer-vibration.ts`, `wake-lock.ts` |
| React hook | `src/hooks/useIntervalTimer.ts` |
| UI | `src/components/platform/timer/*` |

## Timer State Machine

```
IDLE → PREPARING → WORK ⇄ REST → … → COMPLETED
         ↕ PAUSED
```

- No rest after the final work round
- Skip advances instantly to the next phase
- Stop returns to `IDLE`

## Time Accuracy

Uses **timestamp-based** phase end times:

```
phaseEndTime = Date.now() + duration
remaining = phaseEndTime - Date.now()
```

- UI tick every **250ms** (not per-second decrement)
- On `visibilitychange`, `syncSession()` fast-forwards through elapsed phases
- Pause stores `pausedRemainingMs`; resume rebuilds `phaseEndTime`

## Wake Lock

- Requested on session start (`navigator.wakeLock` when supported)
- Re-acquired when page becomes visible again
- Released on stop/complete/unmount
- Soft hint shown if unsupported: «لأفضل تجربة، حافظ على الشاشة مفتوحة»

## Audio

Web Audio API oscillators (no external files). Initialized after first user interaction (`primeTimerAudio` on Start).

| Event | Behavior |
|-------|----------|
| Prep tick | Short beep |
| Work start | Higher tone + optional vibration |
| Rest start | Lower tone + double vibration |
| Final 3s | Pulse beeps |
| Complete | 3-note success |

Sound/vibration failures never block the timer.

## Local Storage

| Key | Content |
|-----|---------|
| `hakim_interval_timer_settings` | Last config, preset id, sound/vibration flags (v1) |
| `hakim_interval_timer_presets` | Custom presets (max 12) |

Default first-load preset: **Tabata**.

## Built-in Presets

| Preset | Work | Rest | Rounds | Prep |
|--------|------|------|--------|------|
| Tabata | 20s | 10s | 8 | 5s |
| HIIT للمبتدئين | 40s | 20s | 10 | 5s |
| Fat Burn | 45s | 15s | 12 | 5s |
| Boxing | 3m | 1m | 12 | 10s |

Selecting a preset loads values but **does not auto-start**.

## Unit Self-Checks

```ts
import { intervalTimerSelfChecks } from "@/lib/platform/timer/interval-timer-engine";
console.table(intervalTimerSelfChecks());
```

**8/8 checks** cover PREPARING→WORK, WORK→REST, REST→round 2, final COMPLETED, pause/resume, no rest after last round.

## Build

Run: `npm run build` — required before merge per PROJECT_HANDBOOK.

## Known Limitations (v1)

- No background audio guarantee on iOS when screen is locked
- No Supabase sync / cross-device presets
- No Stopwatch / Countdown / Quick Timer tabs
- No workout program integration yet (logic structured for future `rest_seconds` injection)
- No vitest harness in repo; engine self-checks provided instead

## Out of Scope (as specified)

- Admin preset management
- Analytics / long-term stats
- Apple Health / Google Fit
- Push notifications while backgrounded

## QA Checklist

- [ ] Tabata default on first open
- [ ] Preset tap changes values without starting
- [ ] Start → prep countdown → work → rest cycles
- [ ] Pause/resume preserves remaining time
- [ ] Background return corrects phase/round
- [ ] No rest after final work round
- [ ] Back/stop dialogs during active session
- [ ] Custom preset save + local persistence
- [ ] RTL + 44px touch targets + reduced motion
