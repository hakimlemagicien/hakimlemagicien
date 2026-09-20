import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2] ?? "fitmaak@gmail.com";
const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const readEnv = (name) => {
  const match = env.match(new RegExp(`^${name}=(.*)$`, "m"));
  if (!match) throw new Error(`Missing ${name}`);
  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
};

const url = readEnv("VITE_SUPABASE_URL");
const projectRef = new URL(url).hostname.split(".")[0];
const keys = JSON.parse(
  execFileSync(
    "supabase",
    ["projects", "api-keys", "--project-ref", projectRef, "--output", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ),
);
const serviceKey = keys.find((item) => item.name === "service_role" && item.type === "legacy")?.api_key;
if (!serviceKey) throw new Error("Production service key unavailable");

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const one = async (query, label) => {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
};

const profile = await one(
  db.from("profiles").select("id,email,goal").eq("email", email).single(),
  "profile",
);
const assignments = await one(
  db
    .from("client_nutrition_assignments")
    .select("id,status,validation_status,resolved_snapshot,assignment_version,created_at")
    .eq("client_id", profile.id)
    .order("created_at", { ascending: false }),
  "assignments",
);
const targets = await one(
  db
    .from("client_nutrition_targets")
    .select("id,calories,protein_g,carbs_g,fat_g,status,created_at")
    .eq("client_id", profile.id)
    .order("created_at", { ascending: false }),
  "targets",
);
const active = assignments.find((row) => row.status === "active") ?? assignments[0] ?? null;
const slots = active
  ? await one(
      db
        .from("client_nutrition_slots")
        .select(
          "slot_key,display_order,source_external_id,name_ar,meal_type,calories,protein_g,carbs_g,fat_g,serving_size,serving_unit,servings,allergens",
        )
        .eq("assignment_id", active.id)
        .order("display_order"),
      "slots",
    )
  : [];
const meal025 = await one(
  db
    .from("meals")
    .select(
      "id,external_id,name_ar,name_en,calories,protein_g,carbs_g,fat_g,serving_size,serving_unit,preparation_steps_ar,image_path,image_thumb_path,status",
    )
    .eq("external_id", "MEAL-025")
    .single(),
  "MEAL-025",
);
const ingredients025 = await one(
  db
    .from("meal_ingredients")
    .select("ingredient_order,ingredient_key,name_ar,name_en,quantity,unit")
    .eq("meal_id", meal025.id)
    .order("ingredient_order"),
  "MEAL-025 ingredients",
);

const snapshot = active?.resolved_snapshot ?? {};
console.log(
  JSON.stringify(
    {
      client: profile,
      counts: { assignments: assignments.length, targets: targets.length, slots: slots.length },
      active_assignment: active
        ? {
            id: active.id,
            status: active.status,
            validation_status: active.validation_status,
            assignment_version: active.assignment_version,
            target: snapshot.target_snapshot ?? targets[0] ?? null,
            actual: snapshot.planned_totals ?? null,
            validation: snapshot.validation_result ?? null,
          }
        : null,
      slots,
      meal_025: { ...meal025, ingredients: ingredients025 },
    },
    null,
    2,
  ),
);
