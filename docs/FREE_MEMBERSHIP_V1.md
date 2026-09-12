# FREE Membership V1

**Status:** Active contract (2026-09-12)  
**Scope:** Authenticated free members in `/app`

## Contract

| Surface | FREE | PAID (Essential / Premium / VIP) |
|---------|------|----------------------------------|
| **Training** | Promo video + program structure preview | Full session access |
| **Training exercises** | Locked (names, media, sets/reps/rest hidden) | Full unlock |
| **Nutrition** | 1 real goal-based breakfast | Full day per entitlement |
| **Other meals** | Locked (slot type only) | Unlocked |
| **Coach chat** | Off | Per tier |
| **Full program assignment** | Off (strategy preview only) | On |

### Training (FREE)

- `structure_preview = ON`
- `promo_video = ON` — `/media/free-membership/training-promo.mp4` (marketing only; not Exercise Library / Training Engine)
- `exercise_content = OFF` — `training_allowed_exercises_per_session = 0`

UI stack: Header → Promo Video → Program Summary → Weekly Structure → Locked day cards → Upgrade CTA («افتح برنامجك الكامل»).

### Nutrition (FREE)

- `breakfast = ON` — real Meal Library meal matched via Goal Profile (`resolveFreeBreakfastGoalKey`)
- `remaining_meals = OFF` — slot label + locked state only

CTA: «افتح خطتك الغذائية الكاملة».

### Entitlements source

Uses existing `get_my_entitlements` / `membership_tiers.features` / client `normalizeEntitlements`.  
No second entitlement system.

### Removed (do not reintroduce)

- 1 exercise/day
- First exercise unlocked
- Daily free exercise unlock
- Copy like «تمرينك المجاني اليوم» / «تمرين واحد مجاني»

## Paid regression

PLUS (Essential) / PRO (Premium) / VIP: training `full_session`, nutrition per tier features, coach per contract — unchanged by this FREE V1 cutover.
