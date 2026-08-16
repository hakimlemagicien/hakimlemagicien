# Nutrition Data Contract — Pilot 1.1

This batch is a direct extension of the approved Pilot contract. Primary key: `external_id`. Required bilingual identity, description, ingredients, and preparation; one-serving nutrition; allergen array; goals/tags; substitution profile; image object; review workflow; and QA object.

## Controlled values
- meal_type: Breakfast, Lunch, Dinner, Snack, Pre-workout, Post-workout
- review_status: approved
- image.status: ready

## Substitution contract
Same meal type; calories ±10%; protein ±8 g; exclude candidates conflicting with user allergens; no alternative is valid when no safe match exists.

## Image contract
Master PNG: `images/MEAL-NNN.png`; delivery: `delivery/MEAL-NNN/cover.webp`; thumbnail: `thumbnail/MEAL-NNN/cover-thumb.webp`. UI must not load master PNG files.
