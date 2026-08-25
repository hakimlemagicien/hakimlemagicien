#!/usr/bin/env python3
"""Replace the runtime Meal Library with Nutrition V2 (MEAL-001–MEAL-300).

V1 catalogs and upsert scripts must not be imported or executed after this runs.
Identity stays MEAL-NNN. Content, meal_type, images, and macros come from V2 only.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path("/Users/hakimlemagicien/Documents/GitHub/hakimlemagicien")
SOURCE_ROOT = Path(
    "/Users/hakimlemagicien/Documents/Hakim Coaching Platform/Nutrition Library/source"
)
V2_PACKAGES = [
    SOURCE_ROOT / "nutrition_v2_MEAL-001-020" / "04_LIBRARY" / "meals.remediated.json",
    SOURCE_ROOT / "nutrition_v2_MEAL-021-060" / "04_LIBRARY" / "meals.remediated.json",
    SOURCE_ROOT / "nutrition_v2_MEAL-061-100" / "04_LIBRARY" / "meals.generated.json",
    SOURCE_ROOT / "nutrition_v2_MEAL-101-300" / "04_LIBRARY" / "meals.remediated.json",
]
OUT_RUNTIME = ROOT / "src/lib/platform/data/nutrition-library-v2.json"
OUT_LIBRARY = ROOT / "nutrition-library/v2/nutrition-library-v2.json"
OUT_SQL = ROOT / "scripts/upsert-meal-library-v2.sql"
OUT_SOURCE = ROOT / "nutrition-library/SOURCE.json"

ALLOWED_MEAL_TYPES = {
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "pre_workout",
    "post_workout",
    "drinks",
}
ALLOWED_GOALS = {"fat_loss", "maintenance", "muscle_gain"}
ALLOWED_ALLERGENS = {
    "milk",
    "egg",
    "gluten",
    "fish",
    "tree_nuts",
    "sesame",
    "soy",
    "peanuts",
    "shellfish",
}


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


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_text_array(values: list[str]) -> str:
    if not values:
        return "ARRAY[]::text[]"
    return "ARRAY[" + ",".join(sql_quote(v) for v in values) + "]::text[]"


def sql_json(value: object) -> str:
    return sql_quote(json.dumps(value, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def load_v2_meals() -> list[dict]:
    meals: list[dict] = []
    for path in V2_PACKAGES:
        if not path.exists():
            raise FileNotFoundError(path)
        batch = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(batch, list):
            raise ValueError(f"{path} is not a meal list")
        meals.extend(batch)
    return meals


def normalize_ingredient(raw: dict, order: int) -> dict:
    quantity = float(raw.get("amount", raw.get("quantity")))
    kcal = float(raw.get("calories", raw.get("kcal", 0)))
    source_url = str(raw.get("source_url") or raw.get("source_query_url") or "")
    ingredient = {
        "ingredient_order": int(raw.get("ingredient_order") or order),
        "ingredient_key": str(raw["ingredient_key"]),
        "name_en": str(raw["name_en"]),
        "name_ar": str(raw["name_ar"]),
        "quantity": quantity,
        "unit": str(raw.get("unit") or "g"),
        "kcal": kcal,
        "protein_g": float(raw.get("protein_g") or 0),
        "carbs_g": float(raw.get("carbs_g") or 0),
        "fat_g": float(raw.get("fat_g") or 0),
        "source": str(raw.get("source") or "USDA FoodData Central"),
        "source_query_url": source_url,
    }
    if raw.get("fiber_g") is not None:
        ingredient["fiber_g"] = float(raw["fiber_g"])
    if raw.get("fdc_id") is not None:
        ingredient["fdc_id"] = raw["fdc_id"]
    return ingredient


def normalize_meal(raw: dict) -> dict:
    external_id = str(raw["external_id"])
    meal_type = str(raw["meal_type"])
    if meal_type not in ALLOWED_MEAL_TYPES:
        raise ValueError(f"{external_id} has illegal meal_type {meal_type}")
    goals = [g for g in raw.get("suitable_goals") or [] if g in ALLOWED_GOALS]
    if not goals:
        raise ValueError(f"{external_id} has no allowed suitable_goals")
    allergens = []
    for item in raw.get("allergens") or []:
        key = str(item).strip().lower().replace(" ", "_")
        if key in {"eggs"}:
            key = "egg"
        if key not in ALLOWED_ALLERGENS:
            raise ValueError(f"{external_id} has illegal allergen {item}")
        if key not in allergens:
            allergens.append(key)
    calories = float(raw["calories"])
    protein = float(raw["protein_g"])
    carbs = float(raw["carbs_g"])
    fat = float(raw["fat_g"])
    qa_raw = raw.get("qa") or {}
    source_energy = float(qa_raw.get("source_energy_kcal") or qa_raw.get("ingredient_energy_kcal") or 0)
    published_energy = float(
        qa_raw.get("published_macro_energy_kcal") or qa_raw.get("macro_energy_kcal") or calories
    )
    energy_delta = float(
        qa_raw.get("energy_delta_pct") or qa_raw.get("macro_vs_ingredient_delta_pct") or 0
    )
    ingredients = [
        normalize_ingredient(item, index)
        for index, item in enumerate(raw.get("ingredients") or [], start=1)
    ]
    if not ingredients:
        raise ValueError(f"{external_id} has no ingredients")
    sub = raw.get("substitution_profile") or {}
    image = raw.get("image") or {}
    return {
        "external_id": external_id,
        "name_ar": str(raw["name_ar"]),
        "name_en": str(raw["name_en"]),
        "description_ar": str(raw.get("description_ar") or ""),
        "description_en": str(raw.get("description_en") or ""),
        "meal_type": meal_type,
        "suitable_goals": goals,
        "dietary_tags": list(raw.get("dietary_tags") or []),
        "allergens": allergens,
        "calories": calories,
        "protein_g": protein,
        "carbs_g": carbs,
        "fat_g": fat,
        "serving_size": float(raw["serving_size"]),
        "serving_unit": str(raw.get("serving_unit") or "g"),
        "yield_servings": int(raw.get("yield_servings") or 1),
        "ingredients": ingredients,
        "preparation_steps_ar": list(raw.get("preparation_steps_ar") or []),
        "preparation_steps_en": list(raw.get("preparation_steps_en") or []),
        "preparation_time_minutes": int(raw.get("preparation_time_minutes") or 0),
        "image": {
            "reference": f"images/{external_id}.png",
            "status": str(image.get("status") or "ready"),
            "alt_ar": str(image.get("alt_ar") or raw["name_ar"]),
            "alt_en": str(image.get("alt_en") or raw["name_en"]),
            "master_path": str(image.get("master_path") or f"images/master/{external_id}.png"),
            "thumbnail_path": str(
                image.get("thumbnail_path") or f"images/thumbnails/{external_id}.webp"
            ),
        },
        "image_status": "ready",
        "status": "published",
        "review_status": str(raw.get("review_status") or "ready"),
        "notes": "Nutrition Library V2. USDA FoodData Central. One serving. Identity is external_id.",
        "substitution_profile": {
            "calorie_band_kcal": calorie_band(calories),
            "protein_band_g": protein_band(protein),
            "carb_band_g": carb_band(carbs),
            "fat_band_g": fat_band(fat),
            "meal_type_required": bool(sub.get("meal_type_required", True)),
            "max_calorie_delta_pct": int(sub.get("max_calorie_delta_pct", 10)),
            "max_protein_delta_g": int(sub.get("max_protein_delta_g", 8)),
            "exclude_allergens": bool(sub.get("exclude_allergens", True)),
        },
        "qa": {
            "ingredient_energy_kcal": source_energy,
            "macro_energy_kcal": published_energy,
            "macro_vs_ingredient_delta_pct": energy_delta,
            "macro_formula": "protein_g*4 + carbs_g*4 + fat_g*9",
            "source_energy_kcal": source_energy,
            "published_macro_energy_kcal": published_energy,
            "energy_delta_pct": energy_delta,
            "derived_fiber_g": qa_raw.get("derived_fiber_g"),
            "nutrition_check": qa_raw.get("nutrition_check"),
            "ingredient_check": qa_raw.get("ingredient_check"),
            "allergen_check": qa_raw.get("allergen_check"),
            "dietary_tag_check": qa_raw.get("dietary_tag_check"),
            "goal_suitability_check": qa_raw.get("goal_suitability_check"),
            "bilingual_check": qa_raw.get("bilingual_check"),
        },
    }


def meal_sql_row(meal: dict) -> str:
    number = int(meal["external_id"].split("-")[1])
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
                str(meal["yield_servings"]),
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
                str(number),
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
                str(ing["kcal"]),
                str(ing["protein_g"]),
                str(ing["carbs_g"]),
                str(ing["fat_g"]),
                sql_quote(ing["source"]),
                sql_quote(ing["source_query_url"]),
            ]
        )
        + ")"
    )


def write_sql(meals: list[dict]) -> None:
    ids = [meal["external_id"] for meal in meals]
    ids_sql = ",".join(sql_quote(i) for i in ids)
    meal_values = ",\n".join(meal_sql_row(meal) for meal in meals)
    ing_values = ",\n".join(
        ingredient_sql_row(meal, ing) for meal in meals for ing in meal["ingredients"]
    )
    sql = f"""-- Nutrition Library V2 upsert — MEAL-001..MEAL-300
-- Replaces V1 catalog content on the same external_id keys.
-- Do not run scripts/upsert-meal-library.sql or *-021-100 / *-101-300 after this.

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


def main() -> None:
    raw_meals = load_v2_meals()
    meals = [normalize_meal(item) for item in raw_meals]
    ids = [meal["external_id"] for meal in meals]
    expected = [f"MEAL-{n:03d}" for n in range(1, 301)]
    if ids != expected:
        raise SystemExit(f"ID sequence broken: {ids[0]}..{ids[-1]} count={len(ids)}")
    package = {
        "schema_version": "2.0.0",
        "generated_on": "2026-08-22",
        "nutrition_basis": "Nutrition Library V2 MEAL-001–MEAL-300; USDA FoodData Central; one serving per record",
        "catalog": "nutrition_v2",
        "replaces": "nutrition_v1_pilot_and_batches",
        "meals": meals,
    }
    payload = json.dumps(package, ensure_ascii=False, indent=2) + "\n"
    OUT_RUNTIME.parent.mkdir(parents=True, exist_ok=True)
    OUT_RUNTIME.write_text(payload, encoding="utf-8")
    OUT_LIBRARY.parent.mkdir(parents=True, exist_ok=True)
    OUT_LIBRARY.write_text(payload, encoding="utf-8")
    write_sql(meals)
    OUT_SOURCE.write_text(
        json.dumps(
            {
                "title": "Hakim Nutrition Library V2 — Source of Truth",
                "primary_key": "external_id",
                "catalog": "nutrition_v2",
                "current_scope": "MEAL-001 → MEAL-300",
                "retired_catalog": "nutrition_v1 (pilot 001-020 + batches 021-300). Do not import or upsert.",
                "runtime": "src/lib/platform/data/nutrition-library-v2.json",
                "in_repo_copy": "nutrition-library/v2/nutrition-library-v2.json",
                "db_upsert": "scripts/upsert-meal-library-v2.sql",
                "locations": {
                    "source_001_020": "Nutrition Library/source/nutrition_v2_MEAL-001-020",
                    "source_021_060": "Nutrition Library/source/nutrition_v2_MEAL-021-060",
                    "source_061_100": "Nutrition Library/source/nutrition_v2_MEAL-061-100",
                    "source_101_300": "Nutrition Library/source/nutrition_v2_MEAL-101-300",
                    "delivery_images": "public/nutrition/meals/{external_id}/cover.webp",
                    "delivery_thumbs": "public/nutrition/meals/{external_id}/cover-thumb.webp",
                    "master_png": "images/master/{external_id}.png (external source; not committed)",
                },
                "do_not_use": [
                    "src/lib/platform/data/nutrition-pilot-20.json",
                    "src/lib/platform/data/nutrition-library-021-100.json",
                    "src/lib/platform/data/nutrition-library-101-300.json",
                    "scripts/upsert-meal-library.sql",
                    "scripts/upsert-meal-library-021-100.sql",
                    "scripts/upsert-meal-library-101-300.sql",
                    "nutrition-library/batches/",
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    types = {}
    for meal in meals:
        types[meal["meal_type"]] = types.get(meal["meal_type"], 0) + 1
    print("wrote", OUT_RUNTIME)
    print("wrote", OUT_LIBRARY)
    print("wrote", OUT_SQL)
    print("meals", len(meals), "types", types)


if __name__ == "__main__":
    main()
