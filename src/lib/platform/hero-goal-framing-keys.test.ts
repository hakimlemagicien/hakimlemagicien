import {
  assetFileName,
  buildHeroGoalFramingKey,
  canonicalHeroAssetFileName,
  stripViteContentHash,
} from "./hero-goal-framing";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(assetFileName("/assets/foo/bar.webp") === "bar.webp", "asset file from path");
assert(
  assetFileName("https://cdn.example/bar-Ab12Cd34.webp") === "bar-Ab12Cd34.webp",
  "asset file from url",
);
assert(stripViteContentHash("pose-Ab12Cd34.webp") === "pose.webp", "strip vite hash");
assert(
  stripViteContentHash("fat-loss-motivational-side-pose-DjK8xQ2a.webp") ===
    "fat-loss-motivational-side-pose.webp",
  "strip long name hash",
);
assert(stripViteContentHash("pose.webp") === "pose.webp", "no hash untouched");
assert(canonicalHeroAssetFileName("/x/pose-Zz99Yy11.webp") === "pose.webp", "canonical from path");
assert(
  buildHeroGoalFramingKey("male", "muscle", "/assets/pose-Ab12Cd34.webp") ===
    "male:muscle:pose.webp",
  "framing key uses canonical file",
);
assert(
  buildHeroGoalFramingKey("male", "muscle", "pose.webp") === "male:muscle:pose.webp",
  "framing key from original fileName",
);

assert(
  buildHeroGoalFramingKey("female", "glutes", "/assets/woman_pink_bottom_fade-Ab12Cd34.png") ===
    "female:glutes:woman_pink_bottom_fade.png",
  "female glutes framing key strips vite hash",
);

console.log("hero-goal-framing-keys.test.ts: all assertions passed");
