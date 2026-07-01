import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const outputRoot = join(process.cwd(), ".vercel/output");
const requiredPaths = [
  "config.json",
  "nitro.json",
  join("functions", "__server.func", "index.mjs"),
  join("functions", "__server.func", ".vc-config.json"),
  "static",
];

for (const relativePath of requiredPaths) {
  const absolutePath = join(outputRoot, relativePath);
  if (!existsSync(absolutePath)) {
    console.error(`[verify-vercel-build] Missing ${relativePath}`);
    process.exit(1);
  }
}

const externalTslibPattern = /from\s+["']tslib["']|import\s+["']tslib["']/;

function scanForExternalTslib(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      scanForExternalTslib(absolutePath);
      continue;
    }
    if (!entry.name.endsWith(".mjs")) continue;
    const source = readFileSync(absolutePath, "utf8");
    if (externalTslibPattern.test(source)) {
      console.error(`[verify-vercel-build] External tslib import in ${absolutePath}`);
      process.exit(1);
    }
  }
}

scanForExternalTslib(join(outputRoot, "functions"));
console.log("[verify-vercel-build] OK");
