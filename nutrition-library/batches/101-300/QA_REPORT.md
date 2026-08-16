# QA Report

- Nutrition consistency QA: PASS — values derived deterministically from per-100 g/ml ingredient references and quantities; rounding occurs after summation.
- Ingredient QA: PASS (0 failures).
- Arabic QA: PASS (0 failures).
- Preparation QA: PASS (0 failures).
- Allergen QA: PASS — allergens are derived from the ingredient reference allergen flags.
- Substitution QA: PASS; 0 NO_VALID_SUBSTITUTE records.
- Duplicate QA: PASS — duplicate IDs 0, duplicate EN names 0, duplicate AR names 0, duplicate image hashes 0.
- Image technical QA: PASS — 200 valid square PNG files, minimum side 1024 px.
- Image semantic QA: PASS against the per-meal generation specification (meal type, ingredients, quantities, preparation, serving size, exclusions) recorded in `image_prompts.json`; no unrelated stock-image mapping was used.
- Link QA: PASS — 0 broken links.

## Machine-readable results

```json
{
  "record_count": 200,
  "image_count": 200,
  "mapping_count": 200,
  "ids_exact_sequence": true,
  "duplicate_ids": 0,
  "missing_fields": [],
  "distribution_exact": true,
  "distribution": {
    "Breakfast": 37,
    "Lunch": 44,
    "Dinner": 38,
    "Snack": 28,
    "Pre-Workout": 16,
    "Post-Workout": 20,
    "Drinks / Nutritional Add-ons": 17
  },
  "ingredient_failures": [],
  "arabic_failures": [],
  "preparation_failures": [],
  "substitution_failures": [],
  "no_valid_substitute_count": 0,
  "duplicate_name_en": 0,
  "duplicate_name_ar": 0,
  "image_names_exact": true,
  "image_technical_failures": [],
  "duplicate_image_hashes": 0,
  "broken_image_links": []
}
```
