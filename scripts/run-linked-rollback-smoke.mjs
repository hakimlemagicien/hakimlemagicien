import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = process.argv.slice(2);
if (files.length === 0) throw new Error("Provide at least one SQL smoke file");

for (const file of files) {
  const path = resolve(file);
  const source = readFileSync(path, "utf8");
  if (!/\bBEGIN\s*;/i.test(source) || !/\bROLLBACK\s*;/i.test(source)) {
    throw new Error(`Refusing non-rollback smoke file: ${file}`);
  }
  const sql = source
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("\\"))
    .join("\n");

  const output = execFileSync(
    "supabase",
    ["db", "query", "--linked", "--output", "json"],
    { encoding: "utf8", input: sql, stdio: ["pipe", "pipe", "pipe"] },
  );
  console.log(JSON.stringify({ file, status: "PASS", output: output.trim() }));
}
