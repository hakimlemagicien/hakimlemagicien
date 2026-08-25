#!/usr/bin/env python3
"""RETIRED. Normalize MEAL-101–MEAL-300 into the adopted Meal Library runtime contract."""

from __future__ import annotations

raise SystemExit("RETIRED: Nutrition Library V1. Use scripts/integrate-nutrition-library-v2.py")

import json
import re
import shutil
from pathlib import Path

ROOT = Path("/Users/hakimlemagicien/Documents/GitHub/hakimlemagicien")
SOURCE = Path(
    "/Users/hakimlemagicien/Documents/Hakim Coaching Platform/Nutrition Library/source/MEAL-101-300"
)
OUT_JSON = ROOT / "src/lib/platform/data/nutrition-library-101-300.json"
OUT_SQL = ROOT / "scripts/upsert-meal-library-101-300.sql"
BATCH_DIR = ROOT / "nutrition-library/batches/101-300"

MEAL_TYPE_MAP = {
    "Breakfast": "breakfast",
    "Lunch": "lunch",
    "Dinner": "dinner",
    "Snack": "snack",
    "Pre-Workout": "pre_workout",
    "Pre-workout": "pre_workout",
    "Post-Workout": "post_workout",
    "Post-workout": "post_workout",
    "Drinks": "drinks",
    "Drinks / Nutritional Add-ons": "drinks",
}

ANIMAL = re.compile(
    r"\b(chicken|beef|lamb|turkey|pork|fish|salmon|tuna|cod|mackerel|sardine|"
    r"shrimp|prawn|mussel|anchovy|egg|whey|yogurt|yoghurt|milk|cheese|labneh|"
    r"cottage|kefir|butter|ghee|honey|gelatin)\b",
    re.I,
)
DAIRY_EGG_HONEY = re.compile(
    r"\b(yogurt|yoghurt|milk|cheese|labneh|cottage|kefir|whey|butter|egg|honey|ghee)\b",
    re.I,
)
GLUTEN = re.compile(
    r"\b(wheat|bread|pita|pasta|couscous|bulgur|barley|farro|freekeh|oat|"
    r"oats|flour|wrap|tortilla|noodle|semolina|croissant|bun)\b",
    re.I,
)
RICE_NOODLE = re.compile(r"rice noodle", re.I)


def slug(text: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")
    return value[:48] or "ingredient"


def parse_serving(raw: str) -> tuple[float, str]:
    match = re.match(r"^\s*([\d.]+)\s*([a-zA-Z]+)\s*$", raw)
    if not match:
        raise ValueError(f"unparseable serving_size: {raw}")
    return float(match.group(1)), match.group(2).lower()


def calorie_band(calories: float) -> str:
    if calories < 300:
        return "under_300"
    if calories < 450:
        return "300_449"
    if calories < 600:
        return "450_599"
    return "600_plus"


def protein_band(protein: float) -> str:
    if protein < 20:
        return "under_20"
    if protein < 30:
        return "20_29"
    if protein < 40:
        return "30_39"
    return "40_plus"


def carb_band(carbs: float) -> str:
    if carbs < 25:
        return "low"
    if carbs < 50:
        return "moderate"
    return "high"


def fat_band(fat: float) -> str:
    if fat < 8:
        return "low"
    if fat < 18:
        return "moderate"
    return "high"


def suitable_goals(meal_type: str, calories: float, protein: float) -> list[str]:
    """Placeholder; batch ranking in apply_goal_ranking() is the adopted arrangement."""
    if meal_type == "pre_workout":
        return ["maintenance", "muscle_gain"]
    if meal_type == "post_workout":
        return ["muscle_gain", "maintenance"]
    if meal_type == "drinks":
        if protein >= 20:
            return ["maintenance", "muscle_gain"]
        return ["maintenance", "fat_loss"]
    if meal_type == "snack":
        if protein >= 20:
            return ["fat_loss", "maintenance"]
        return ["maintenance"]
    if meal_type in {"lunch", "dinner"}:
        if calories <= 400:
            return ["fat_loss", "maintenance"]
        if protein >= 40:
            return ["maintenance", "muscle_gain"]
        return ["maintenance"]
    if calories <= 390 and protein >= 20:
        return ["fat_loss", "maintenance"]
    return ["maintenance"]


def apply_goal_ranking(meals: list[dict]) -> None:
    """Arrange goals by value within each meal_type (calories + protein)."""
    from collections import defaultdict

    by_type: dict[str, list[dict]] = defaultdict(list)
    for meal in meals:
        by_type[meal["meal_type"]].append(meal)
    for meal_type, group in by_type.items():
        calories = sorted(item["calories"] for item in group)
        proteins = sorted(item["protein_g"] for item in group)
        cal_cut = calories[max(0, int(len(calories) * 0.4) - 1)]
        protein_cut = proteins[min(len(proteins) - 1, int(len(proteins) * 0.6))]
        for meal in group:
            goals: list[str] = []
            if meal_type == "pre_workout":
                goals = ["maintenance", "muscle_gain"]
                if meal["calories"] <= cal_cut:
                    goals = ["fat_loss", "maintenance", "muscle_gain"]
            elif meal_type == "post_workout":
                goals = ["muscle_gain", "maintenance"]
                if meal["calories"] <= cal_cut:
                    goals = ["muscle_gain", "maintenance", "fat_loss"]
            else:
                goals = ["maintenance"]
                if meal["calories"] <= cal_cut:
                    goals = ["fat_loss", "maintenance"]
                if meal["protein_g"] >= protein_cut:
                    if "muscle_gain" not in goals:
                        goals.append("muscle_gain")
            meal["suitable_goals"] = goals


def dietary_tags(meal: dict, protein: float) -> list[str]:
    names = " ".join(ing["name_en"] for ing in meal["ingredients"])
    tags: list[str] = []
    animal = bool(ANIMAL.search(names))
    if not animal:
        tags.append("vegetarian")
        if not DAIRY_EGG_HONEY.search(names):
            tags.append("vegan")
    gluten_hit = bool(GLUTEN.search(names)) and not (
        RICE_NOODLE.search(names) and GLUTEN.search(names) is None
    )
    if gluten_hit:
        # rice noodles should not force gluten; GLUTEN includes noodle
        if RICE_NOODLE.search(names):
            names_wo = RICE_NOODLE.sub(" ", names)
            gluten_hit = bool(GLUTEN.search(names_wo))
    if not gluten_hit:
        tags.append("gluten_free")
    if protein >= 25:
        tags.append("high_protein")
    return tags


def prep_minutes(meal_type: str) -> int:
    return {
        "breakfast": 10,
        "lunch": 25,
        "dinner": 25,
        "snack": 5,
        "pre_workout": 5,
        "post_workout": 12,
        "drinks": 3,
    }[meal_type]


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_text_array(values: list[str]) -> str:
    if not values:
        return "ARRAY[]::text[]"
    return "ARRAY[" + ",".join(sql_quote(v) for v in values) + "]::text[]"


def sql_json(value: object) -> str:
    return sql_quote(json.dumps(value, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def normalize_meal(raw: dict) -> dict:
    meal_type = MEAL_TYPE_MAP[raw["meal_type"]]
    calories = float(raw["calories"])
    protein = float(raw["protein_g"])
    carbs = float(raw["carbs_g"])
    fat = float(raw["fat_g"])
    serving_size, serving_unit = parse_serving(raw["serving_size"])
    external_id = raw["external_id"]
    number = int(external_id.split("-")[1])
    ingredients = []
    used_keys: dict[str, int] = {}
    for index, ing in enumerate(raw["ingredients"], start=1):
        key = slug(ing["name_en"])
        used_keys[key] = used_keys.get(key, 0) + 1
        if used_keys[key] > 1:
            key = f"{key}_{used_keys[key]}"
        ingredients.append(
            {
                "ingredient_order": index,
                "ingredient_key": key,
                "name_en": ing["name_en"],
                "name_ar": ing["name_ar"],
                "quantity": float(ing["quantity"]),
                "unit": ing["unit"],
                "kcal": 0,
                "protein_g": 0,
                "carbs_g": 0,
                "fat_g": 0,
                "source": "USDA FoodData Central generic food; edible portion; preparation state as named",
                "source_query_url": "https://fdc.nal.usda.gov/",
            }
        )
    macro_energy = round(protein * 4 + carbs * 4 + fat * 9, 1)
    return {
        "external_id": external_id,
        "sort_order": number,
        "name_ar": raw["name_ar"],
        "name_en": raw["name_en"],
        "description_ar": f"وجبة {raw['name_ar']} محسوبة من أوزان المكونات المدرجة لحصة واحدة.",
        "description_en": f"A single-serving {raw['name_en']} meal calculated from the listed ingredient weights.",
        "meal_type": meal_type,
        "suitable_goals": suitable_goals(meal_type, calories, protein),
        "dietary_tags": dietary_tags(raw, protein),
        "allergens": list(raw.get("allergens") or []),
        "calories": calories,
        "protein_g": protein,
        "carbs_g": carbs,
        "fat_g": fat,
        "serving_size": serving_size,
        "serving_unit": serving_unit,
        "yield_servings": 1,
        "ingredients": ingredients,
        "preparation_steps_ar": list(raw["preparation_steps_ar"]),
        "preparation_steps_en": list(raw["preparation_steps_en"]),
        "preparation_time_minutes": prep_minutes(meal_type),
        "image": {
            "reference": f"images/{external_id}.png",
            "status": "ready",
            "alt_ar": raw["name_ar"],
            "alt_en": raw["name_en"],
        },
        "image_status": "ready",
        "status": "published",
        "review_status": "approved",
        "notes": "Imported from Nutrition Library MEAL-101–MEAL-300 package; macros unchanged.",
        "substitution_profile": {
            "calorie_band_kcal": calorie_band(calories),
            "protein_band_g": protein_band(protein),
            "carb_band_g": carb_band(carbs),
            "fat_band_g": fat_band(fat),
            "meal_type_required": True,
            "max_calorie_delta_pct": 10,
            "max_protein_delta_g": 8,
            "exclude_allergens": True,
        },
        "qa": {
            "ingredient_energy_kcal": 0,
            "macro_energy_kcal": macro_energy,
            "macro_vs_ingredient_delta_pct": 0,
            "macro_formula": "protein_g*4 + carbs_g*4 + fat_g*9",
        },
    }


def meal_sql_row(meal: dict) -> str:
    return (
        "("
        + ", ".join(
            [
                sql_quote(meal["external_id"]),
                sql_quote(meal["name_ar"]),
                sql_quote(meal["name_en"]),
                sql_quote(meal["description_ar"]),
                sql_quote(meal["description_en"]),
                f"{sql_quote(meal['meal_type'])}::public.meal_type",
                sql_text_array(meal["suitable_goals"]),
                sql_text_array(meal["dietary_tags"]),
                sql_text_array(meal["allergens"]),
                str(meal["calories"]),
                str(meal["protein_g"]),
                str(meal["carbs_g"]),
                str(meal["fat_g"]),
                str(meal["serving_size"]),
                sql_quote(meal["serving_unit"]),
                "1",
                sql_text_array(meal["preparation_steps_ar"]),
                sql_text_array(meal["preparation_steps_en"]),
                str(meal["preparation_time_minutes"]),
                sql_quote(f"/nutrition/meals/{meal['external_id']}/cover.webp"),
                sql_quote(f"/nutrition/meals/{meal['external_id']}/cover-thumb.webp"),
                sql_quote(f"images/{meal['external_id']}.png"),
                "'ready'::public.meal_image_status",
                sql_quote(meal["name_ar"]),
                sql_quote(meal["name_en"]),
                "'published'::public.meal_library_status",
                sql_quote(meal["review_status"]),
                sql_quote(meal["notes"]),
                sql_json(meal["substitution_profile"]),
                sql_json(meal["qa"]),
                "TRUE",
                str(meal["sort_order"]),
            ]
        )
        + ")"
    )


def ingredient_sql_row(meal: dict, ing: dict) -> str:
    return (
        "("
        + ", ".join(
            [
                sql_quote(meal["external_id"]),
                str(ing["ingredient_order"]),
                sql_quote(ing["ingredient_key"]),
                sql_quote(ing["name_en"]),
                sql_quote(ing["name_ar"]),
                str(ing["quantity"]),
                sql_quote(ing["unit"]),
                "NULL::numeric",
                "NULL::numeric",
                "NULL::numeric",
                "NULL::numeric",
                sql_quote(ing["source"]),
                sql_quote(ing["source_query_url"]),
            ]
        )
        + ")"
    )


def copy_package_metadata() -> None:
    BATCH_DIR.mkdir(parents=True, exist_ok=True)
    for name in [
        "README.md",
        "QA_REPORT.md",
        "NUTRITION_BATCH_REPORT.md",
        "NUTRITION_DATA_CONTRACT.md",
        "NUTRITION_CALCULATION_SOURCES.md",
        "nutrition_batch_101_300.json",
        "nutrition_batch_101_300.csv",
        "nutrition_batch_101_300_ingredients.csv",
        "meal_image_mapping.json",
        "image_prompts.json",
        "manifest.json",
    ]:
        src = SOURCE / name
        if src.exists():
            shutil.copy2(src, BATCH_DIR / name)
    readme = BATCH_DIR / "PLATFORM_INTEGRATION.md"
    readme.write_text(
        "# MEAL-101–MEAL-300 platform integration\n\n"
        "Source package copied from Hakim Coaching Platform Nutrition Library.\n"
        "Master PNGs (~432MB) stay in the original source folder and are not committed.\n"
        "Runtime delivery images: `public/nutrition/meals/MEAL-XXX/cover.webp`.\n"
        "Runtime catalog: `src/lib/platform/data/nutrition-library-101-300.json`.\n"
        "Drinks package value `Drinks / Nutritional Add-ons` maps to meal_type `drinks`.\n",
        encoding="utf-8",
    )


def main() -> None:
    raw_meals = json.loads((SOURCE / "nutrition_batch_101_300.json").read_text())
    meals = [normalize_meal(item) for item in raw_meals]
    apply_goal_ranking(meals)
    ids = [m["external_id"] for m in meals]
    assert ids == [f"MEAL-{n:03d}" for n in range(101, 301)], "ID sequence broken"
    package = {
        "schema_version": "1.1.0",
        "generated_on": "2026-08-16",
        "nutrition_basis": "Nutrition Library MEAL-101–MEAL-300 package; macros copied unchanged",
        "meals": meals,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    ids_sql = ",".join(sql_quote(i) for i in ids)
    meal_values = ",\n".join(meal_sql_row(m) for m in meals)
    ing_values = ",\n".join(ingredient_sql_row(m, ing) for m in meals for ing in m["ingredients"])
    sql = f"""-- Idempotent upsert for Nutrition Library MEAL-101..MEAL-300
BEGIN;

INSERT INTO public.meals (
  external_id, name_ar, name_en, description_ar, description_en, meal_type,
  suitable_goals, dietary_tags, allergens, calories, protein_g, carbs_g, fat_g,
  serving_size, serving_unit, yield_servings, preparation_steps_ar, preparation_steps_en,
  preparation_time_minutes, image_path, image_thumb_path, image_master_path,
  image_status, image_alt_ar, image_alt_en, status, review_status, notes,
  substitution_profile, qa, is_active, sort_order
)
VALUES
{meal_values}
ON CONFLICT (external_id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  description_ar = EXCLUDED.description_ar,
  description_en = EXCLUDED.description_en,
  meal_type = EXCLUDED.meal_type,
  suitable_goals = EXCLUDED.suitable_goals,
  dietary_tags = EXCLUDED.dietary_tags,
  allergens = EXCLUDED.allergens,
  calories = EXCLUDED.calories,
  protein_g = EXCLUDED.protein_g,
  carbs_g = EXCLUDED.carbs_g,
  fat_g = EXCLUDED.fat_g,
  serving_size = EXCLUDED.serving_size,
  serving_unit = EXCLUDED.serving_unit,
  yield_servings = EXCLUDED.yield_servings,
  preparation_steps_ar = EXCLUDED.preparation_steps_ar,
  preparation_steps_en = EXCLUDED.preparation_steps_en,
  preparation_time_minutes = EXCLUDED.preparation_time_minutes,
  image_path = EXCLUDED.image_path,
  image_thumb_path = EXCLUDED.image_thumb_path,
  image_master_path = EXCLUDED.image_master_path,
  image_status = EXCLUDED.image_status,
  image_alt_ar = EXCLUDED.image_alt_ar,
  image_alt_en = EXCLUDED.image_alt_en,
  status = EXCLUDED.status,
  review_status = EXCLUDED.review_status,
  notes = EXCLUDED.notes,
  substitution_profile = EXCLUDED.substitution_profile,
  qa = EXCLUDED.qa,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

DELETE FROM public.meal_ingredients
WHERE meal_id IN (SELECT id FROM public.meals WHERE external_id IN ({ids_sql}));

INSERT INTO public.meal_ingredients (
  meal_id, ingredient_order, ingredient_key, name_en, name_ar, quantity, unit,
  kcal, protein_g, carbs_g, fat_g, source, source_query_url
)
SELECT m.id, v.ingredient_order, v.ingredient_key, v.name_en, v.name_ar, v.quantity, v.unit,
       v.kcal, v.protein_g, v.carbs_g, v.fat_g, v.source, v.source_query_url
FROM (VALUES
{ing_values}
) AS v(external_id, ingredient_order, ingredient_key, name_en, name_ar, quantity, unit, kcal, protein_g, carbs_g, fat_g, source, source_query_url)
JOIN public.meals m ON m.external_id = v.external_id;

COMMIT;
"""
    OUT_SQL.write_text(sql, encoding="utf-8")
    copy_package_metadata()

    from collections import Counter

    types = Counter(m["meal_type"] for m in meals)
    goals = Counter(tuple(m["suitable_goals"]) for m in meals)
    print(json.dumps({"count": len(meals), "types": dict(types), "goals": {str(k): v for k, v in goals.items()}}, indent=2))


if __name__ == "__main__":
    main()
