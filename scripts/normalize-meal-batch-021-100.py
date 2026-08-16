#!/usr/bin/env python3
"""Normalize MEAL-021–MEAL-100 batch packages into the runtime Meal Library contract."""

from __future__ import annotations

import json
import re
import shutil
from collections import Counter
from pathlib import Path

ROOT = Path("/Users/hakimlemagicien/Documents/GitHub/hakimlemagicien")
BATCH_021 = ROOT / "nutrition-library/batches/021-060/nutrition_batch_021_060.json"
BATCH_061 = ROOT / "nutrition-library/batches/061-100/nutrition_batch_061_100.json"
OUT_JSON = ROOT / "src/lib/platform/data/nutrition-library-021-100.json"
OUT_SQL = ROOT / "scripts/upsert-meal-library-021-100.sql"
PUBLIC = ROOT / "public/nutrition/meals"
DELIVERY_061 = ROOT / "nutrition-library/batches/061-100"

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


def slug(text: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")
    return value[:48] or "ingredient"


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


def serving_of(raw: dict) -> tuple[float, str]:
    serving = raw.get("serving_size")
    if isinstance(serving, dict):
        weight = float(serving.get("total_ingredient_weight_g") or 1)
        units = {ing.get("unit", "g") for ing in raw.get("ingredients", [])}
        unit = "ml" if units == {"ml"} or (raw.get("meal_type") in {"Drinks", "Drinks / Nutritional Add-ons"} and "ml" in units) else "g"
        return weight, unit
    if isinstance(serving, (int, float)):
        return float(serving), str(raw.get("serving_unit") or "g")
    raise ValueError(f"bad serving_size on {raw.get('external_id')}")


def normalize_meal(raw: dict) -> dict:
    meal_type = MEAL_TYPE_MAP[raw["meal_type"]]
    calories = float(raw["calories"])
    protein = float(raw["protein_g"])
    carbs = float(raw["carbs_g"])
    fat = float(raw["fat_g"])
    serving_size, serving_unit = serving_of(raw)
    external_id = raw["external_id"]
    number = int(external_id.split("-")[1])
    used: dict[str, int] = {}
    ingredients = []
    for index, ing in enumerate(raw["ingredients"], start=1):
        key = slug(ing["name_en"])
        used[key] = used.get(key, 0) + 1
        if used[key] > 1:
            key = f"{key}_{used[key]}"
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
                "source": ing.get("nutrition_reference")
                or "USDA FoodData Central generic food; edible portion; preparation state as named",
                "source_query_url": "https://fdc.nal.usda.gov/",
            }
        )
    qa_src = raw.get("qa") or {}
    sub_src = raw.get("substitution_profile") or {}
    return {
        "external_id": external_id,
        "sort_order": number,
        "name_ar": raw["name_ar"],
        "name_en": raw["name_en"],
        "description_ar": raw.get("description_ar") or f"وجبة {raw['name_ar']} بحصة واحدة.",
        "description_en": raw.get("description_en") or f"A single-serving {raw['name_en']} meal.",
        "meal_type": meal_type,
        "suitable_goals": list(raw.get("suitable_goals") or ["maintenance"]),
        "dietary_tags": list(raw.get("dietary_tags") or []),
        "allergens": list(raw.get("allergens") or []),
        "calories": calories,
        "protein_g": protein,
        "carbs_g": carbs,
        "fat_g": fat,
        "serving_size": serving_size,
        "serving_unit": serving_unit,
        "yield_servings": 1,
        "ingredients": ingredients,
        "preparation_steps_ar": list(raw.get("preparation_steps_ar") or []),
        "preparation_steps_en": list(raw.get("preparation_steps_en") or []),
        "preparation_time_minutes": int(raw.get("preparation_time_minutes") or 15),
        "image": {
            "reference": f"images/{external_id}.png",
            "status": "ready",
            "alt_ar": raw["name_ar"],
            "alt_en": raw["name_en"],
        },
        "image_status": "ready",
        "status": "published",
        "review_status": raw.get("review_status") or "approved",
        "notes": "Imported from Nutrition Library batch MEAL-021–MEAL-100; macros unchanged.",
        "substitution_profile": {
            "calorie_band_kcal": calorie_band(calories),
            "protein_band_g": protein_band(protein),
            "carb_band_g": carb_band(carbs),
            "fat_band_g": fat_band(fat),
            "meal_type_required": bool(sub_src.get("same_meal_type", True)),
            "max_calorie_delta_pct": float(sub_src.get("calorie_tolerance_percent", 10)),
            "max_protein_delta_g": float(sub_src.get("protein_tolerance_g", 8)),
            "exclude_allergens": bool(sub_src.get("exclude_user_allergens", True)),
        },
        "qa": {
            "ingredient_energy_kcal": float(qa_src.get("ingredient_energy_kcal") or 0),
            "macro_energy_kcal": float(qa_src.get("macro_energy_kcal") or round(protein * 4 + carbs * 4 + fat * 9, 1)),
            "macro_vs_ingredient_delta_pct": float(qa_src.get("macro_vs_ingredient_delta_pct") or 0),
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


def copy_061_100_delivery() -> int:
    copied = 0
    for number in range(61, 101):
        external_id = f"MEAL-{number:03d}"
        dest = PUBLIC / external_id
        dest.mkdir(parents=True, exist_ok=True)
        cover = DELIVERY_061 / "delivery" / external_id / "cover.webp"
        thumb = DELIVERY_061 / "thumbnail" / external_id / "cover-thumb.webp"
        if not cover.exists() or not thumb.exists():
            raise FileNotFoundError(external_id)
        shutil.copy2(cover, dest / "cover.webp")
        shutil.copy2(thumb, dest / "cover-thumb.webp")
        copied += 1
    return copied


def write_sql(meals: list[dict]) -> None:
    ids = [m["external_id"] for m in meals]
    ids_sql = ",".join(sql_quote(i) for i in ids)
    meal_values = ",\n".join(meal_sql_row(m) for m in meals)
    ing_values = ",\n".join(ingredient_sql_row(m, ing) for m in meals for ing in m["ingredients"])
    OUT_SQL.write_text(
        f"""-- Idempotent upsert for Nutrition Library MEAL-021..MEAL-100
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
""",
        encoding="utf-8",
    )


def main() -> None:
    raw_021 = json.loads(BATCH_021.read_text())["meals"]
    raw_061 = json.loads(BATCH_061.read_text())["meals"]
    meals = [normalize_meal(item) for item in raw_021 + raw_061]
    ids = [m["external_id"] for m in meals]
    expected = [f"MEAL-{n:03d}" for n in range(21, 101)]
    if ids != expected:
        raise SystemExit(f"ID sequence broken: {ids[0]}..{ids[-1]} count={len(ids)}")
    OUT_JSON.write_text(
        json.dumps(
            {
                "schema_version": "1.1.0",
                "generated_on": "2026-08-16",
                "nutrition_basis": "Nutrition Library batches MEAL-021–MEAL-100; macros copied unchanged",
                "meals": meals,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    write_sql(meals)
    copied = copy_061_100_delivery()
    print(
        json.dumps(
            {
                "count": len(meals),
                "copied_061_100_images": copied,
                "types": dict(Counter(m["meal_type"] for m in meals)),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
