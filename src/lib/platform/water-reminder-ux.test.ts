import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const component = readFileSync(
  join(root, "src/components/platform/water/WaterReminderOverlay.tsx"),
  "utf8",
);
const context = readFileSync(join(root, "src/components/platform/water/WaterContext.tsx"), "utf8");
const settings = readFileSync(
  join(root, "src/lib/platform/profile-settings-storage.ts"),
  "utf8",
);
const styles = readFileSync(join(root, "src/styles.css"), "utf8");
const audio = readFileSync(join(root, "src/lib/platform/water-audio.ts"), "utf8");

assert(component.includes("water-reminder-banner"), "top reminder banner exists");
assert(!component.includes('role="dialog"'), "recurring reminder is not a modal dialog");
assert(!component.includes("water-overlay__backdrop"), "recurring reminder has no blocking backdrop");
assert(component.includes("AUTO_DISMISS_MS = 4_000"), "banner auto-dismisses in four seconds");
assert(component.includes("skipWaterReminder"), "banner can be dismissed manually");
assert(component.includes("سجّل كوب"), "banner exposes a lightweight log-water action");
assert(context.includes("sheetOpenRef.current || reminderOpenRef.current"), "reminders do not stack");
assert(context.includes("writeWaterReminderAnchor(userId)"), "water logging defers the next reminder");
assert(context.includes("waterReminderSound"), "sound preference is respected");
assert(settings.includes("waterReminders: boolean"), "reminder on/off control remains available");
assert(settings.includes("waterReminderSound: boolean"), "sound on/off control is available");
assert(styles.includes("width: min(calc(100% - 24px), 430px)"), "banner is mobile width-safe");
assert(audio.includes("WATER_POUR_DURATION_SECONDS = 1.1"), "pour duration is short and calm");
assert(audio.includes("pourIntoGlass(ctx, ctx.currentTime)"), "reminder uses the glass-pour sound");
assert(audio.includes("source.loop = false"), "pour sound never loops");

console.log("water-reminder-ux.test.ts: PASS");
