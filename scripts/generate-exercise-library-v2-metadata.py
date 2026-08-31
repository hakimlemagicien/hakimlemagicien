#!/usr/bin/env python3
"""Author Exercise Library V2 metadata from the canonical catalog names.

This is catalog authoring (not runtime guessing). Output is reviewed metadata
for scripts/exercise-library-v2-metadata.json and the Phase 3 SQL seed.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "scripts" / "exercise-library.json"
OUT = ROOT / "scripts" / "exercise-library-v2-metadata.json"

LOW_CONFIDENCE = {
    "SH-021",  # Bus Driver
    "SH-024",  # Lu Raise
    "SH-025",  # Powell Raise
    "TR-010",  # JM Press
    "TR-020",  # California Press
    "CR-014",  # HIIT Circuit
    "CR-020",  # Tabata
}


def contains(name: str, *needles: str) -> bool:
    n = name.lower()
    return any(needle.lower() in n for needle in needles)


def classify(group: str, item: dict) -> dict:
    eid = item["id"]
    name = item["name"]
    n = name.lower()
    prefix = eid.split("-")[0]

    exercise_type = {
        "Chest": "strength",
        "Back": "strength",
        "Shoulders": "strength",
        "Biceps": "strength",
        "Triceps": "strength",
        "Forearms": "strength",
        "Legs": "strength",
        "Glutes": "strength",
        "Calves": "strength",
        "Abs": "strength",
        "Warm Up": "warmup",
        "Mobility": "mobility",
        "Cardio": "cardio",
    }[group]

    primary_muscle = "CHEST"
    secondary: list[str] = []
    contributions: list[dict] = []
    role = "HORIZONTAL_PUSH"
    secondary_roles: list[str] = []
    mechanics = "COMPOUND"
    loading = "OTHER"
    equipment: list[str] = []
    locations = ["GYM"]
    bodyweight = False
    unilateral = False
    sides = "BILATERAL"
    timed = False
    rx = "REPS"
    conditioning = None
    complexity = "MODERATE"
    beginner = True
    sub_group = "HORIZONTAL_CHEST_PRESS"

    # --- loading / equipment from name ---
    if contains(n, "smith"):
        loading, equipment, locations = "SMITH_MACHINE", ["SMITH_MACHINE"], ["GYM"]
    elif contains(n, "cable"):
        loading, equipment, locations = "CABLE", ["CABLE_STATION"], ["GYM"]
    elif contains(n, "treadmill"):
        loading, equipment, locations = "CARDIO_MACHINE", ["TREADMILL"], ["GYM"]
    elif contains(n, "stationary bike", "assault bike"):
        loading, equipment, locations = "CARDIO_MACHINE", ["BIKE"], ["GYM"]
    elif contains(n, "rowing"):
        loading, equipment, locations = "CARDIO_MACHINE", ["ROWER"], ["GYM"]
    elif contains(n, "elliptical"):
        loading, equipment, locations = "CARDIO_MACHINE", ["ELLIPTICAL"], ["GYM"]
    elif contains(n, "stair"):
        loading, equipment, locations = "CARDIO_MACHINE", ["STAIR_CLIMBER"], ["GYM"]
    elif contains(n, "ski erg"):
        loading, equipment, locations = "CARDIO_MACHINE", ["SKI_ERG"], ["GYM"]
    elif contains(n, "versa climber"):
        loading, equipment, locations = "CARDIO_MACHINE", ["VERSA_CLIMBER"], ["GYM"]
    elif contains(n, "kettlebell"):
        loading, equipment, locations = "KETTLEBELL", ["KETTLEBELL"], ["GYM", "HOME"]
    elif contains(n, "band", "banded"):
        loading, equipment, locations = "BAND", ["RESISTANCE_BAND"], ["GYM", "HOME"]
    elif contains(n, "dumbbell"):
        loading, equipment, locations = "DUMBBELL", ["DUMBBELLS"], ["GYM", "HOME"]
    elif contains(n, "ez bar"):
        loading, equipment, locations = "BARBELL", ["BARBELL"], ["GYM"]
    elif contains(n, "machine", "leg press", "hack squat", "lat pulldown", "hip abduction", "adductor"):
        loading, equipment, locations = "SELECTORIZED_MACHINE", ["MACHINE"], ["GYM"]
    elif contains(n, "landmine"):
        loading, equipment, locations = "BARBELL", ["BARBELL"], ["GYM"]
    elif contains(n, "plate "):
        loading, equipment, locations = "OTHER", ["WEIGHT_PLATE"], ["GYM"]
    elif contains(n, "barbell", "pendlay", "deadlift", "rack pull", "good morning", "shrug") and not contains(n, "dumbbell"):
        loading, equipment, locations = "BARBELL", ["BARBELL"], ["GYM"]
    elif contains(
        n,
        "push up",
        "pull up",
        "chin up",
        "dip",
        "plank",
        "crunch",
        "sit up",
        "hollow",
        "l-sit",
        "burpee",
        "mountain climber",
        "pistol",
        "wall sit",
        "dead hang",
        "inverted row",
        "nordic",
        "bodyweight",
    ):
        loading, equipment, locations = "BODYWEIGHT", [], ["GYM", "HOME", "NO_EQUIPMENT"]
        bodyweight = True
    elif prefix in {"WU", "MO", "AB"} and not contains(n, "cable", "wheel", "machine"):
        loading, equipment, locations = "BODYWEIGHT", ["MAT"] if prefix == "MO" else [], ["GYM", "HOME", "NO_EQUIPMENT"]
        bodyweight = not contains(n, "band", "foam", "wheel")
        if contains(n, "foam"):
            loading, equipment, locations, bodyweight = "OTHER", ["FOAM_ROLLER"], ["GYM", "HOME"], False
        if contains(n, "band"):
            loading, equipment, locations, bodyweight = "BAND", ["RESISTANCE_BAND"], ["GYM", "HOME"], False
        if contains(n, "wheel"):
            loading, equipment, locations, bodyweight = "OTHER", ["AB_WHEEL"], ["GYM", "HOME"], False

    if contains(n, "bench") and "BENCH" not in equipment and loading in {"BARBELL", "DUMBBELL"}:
        equipment = list(dict.fromkeys(equipment + ["BENCH"]))

    if contains(n, "single", "one arm", "one-arm", "pistol", "bulgarian", "split squat", "step up", "step down", "unilateral", "copenhagen"):
        unilateral = True
        sides = "LEFT_RIGHT_SEPARATE"
    if contains(n, "walking lunge", "alternating"):
        unilateral = True
        sides = "ALTERNATING"

    # --- group defaults ---
    if prefix == "CH":
        primary_muscle, secondary = "CHEST", ["TRICEPS", "ANTERIOR_DELTOID"]
        role, sub_group = "HORIZONTAL_PUSH", "HORIZONTAL_CHEST_PRESS"
        mechanics = "ISOLATION" if contains(n, "fly") else "COMPOUND"
        if contains(n, "dip"):
            secondary = ["TRICEPS", "ANTERIOR_DELTOID"]
        if contains(n, "diamond"):
            primary_muscle, secondary, role = "TRICEPS", ["CHEST"], "ELBOW_EXTENSION"
            sub_group = "TRICEPS_EXTENSION"
    elif prefix == "BA":
        if contains(n, "deadlift", "rack pull", "good morning", "hyperextension"):
            primary_muscle, secondary = "HAMSTRINGS", ["GLUTES", "UPPER_BACK"]
            role, sub_group, mechanics = "HINGE", "HINGE_POSTERIOR_CHAIN", "COMPOUND"
            if contains(n, "hyperextension"):
                primary_muscle, secondary, role = "UPPER_BACK", ["GLUTES", "HAMSTRINGS"], "HIP_EXTENSION"
        elif contains(n, "face pull"):
            primary_muscle, secondary = "POSTERIOR_DELTOID", ["TRAPEZIUS", "RHOMBOIDS"]
            role, sub_group, mechanics = "SHOULDER_EXTERNAL_ROTATION", "POSTERIOR_SHOULDER", "ISOLATION"
        elif contains(n, "shrug"):
            primary_muscle, secondary = "TRAPEZIUS", ["FOREARMS"]
            role, sub_group, mechanics = "VERTICAL_PULL", "TRAP_ELEVATION", "ISOLATION"
        elif contains(n, "pulldown", "pull up", "chin"):
            primary_muscle, secondary = "LATS", ["BICEPS", "UPPER_BACK"]
            role, sub_group = "VERTICAL_PULL", "VERTICAL_PULL"
            mechanics = "COMPOUND"
            if contains(n, "assisted"):
                loading, equipment, locations, bodyweight = (
                    "SELECTORIZED_MACHINE",
                    ["ASSISTED_PULL_UP_MACHINE"],
                    ["GYM"],
                    False,
                )
        elif contains(n, "straight arm"):
            primary_muscle, secondary = "LATS", ["TRICEPS"]
            role, sub_group, mechanics = "VERTICAL_PULL", "VERTICAL_PULL", "ISOLATION"
        else:
            primary_muscle, secondary = "UPPER_BACK", ["LATS", "BICEPS"]
            role, sub_group, mechanics = "HORIZONTAL_PULL", "HORIZONTAL_ROW", "COMPOUND"
    elif prefix == "SH":
        primary_muscle = "SHOULDERS"
        if contains(n, "lateral", "y raise", "lu raise"):
            primary_muscle, secondary = "LATERAL_DELTOID", ["TRAPEZIUS"]
            role, sub_group, mechanics = "SHOULDER_ABDUCTION", "LATERAL_DELTOID_RAISE", "ISOLATION"
        elif contains(n, "front raise", "bus driver"):
            primary_muscle, secondary = "ANTERIOR_DELTOID", ["CHEST"]
            role, sub_group, mechanics = "SHOULDER_FLEXION", "ANTERIOR_DELTOID_RAISE", "ISOLATION"
        elif contains(n, "rear", "reverse fly", "powell"):
            primary_muscle, secondary = "POSTERIOR_DELTOID", ["RHOMBOIDS"]
            role, sub_group, mechanics = "HORIZONTAL_PULL", "POSTERIOR_SHOULDER", "ISOLATION"
        elif contains(n, "upright"):
            primary_muscle, secondary = "LATERAL_DELTOID", ["TRAPEZIUS"]
            role, sub_group, mechanics = "SHOULDER_ABDUCTION", "UPRIGHT_ROW", "COMPOUND"
        elif contains(n, "cuban"):
            primary_muscle, secondary = "POSTERIOR_DELTOID", ["UPPER_BACK"]
            role, sub_group, mechanics = "SHOULDER_EXTERNAL_ROTATION", "POSTERIOR_SHOULDER", "ISOLATION"
            complexity = "HIGH"
            beginner = False
        else:
            primary_muscle, secondary = "SHOULDERS", ["TRICEPS"]
            role, sub_group, mechanics = "VERTICAL_PUSH", "VERTICAL_PRESS", "COMPOUND"
    elif prefix == "BI":
        primary_muscle, secondary = "BICEPS", ["FOREARMS"]
        role, sub_group, mechanics = "ELBOW_FLEXION", "BICEPS_CURL", "ISOLATION"
        if contains(n, "zottman", "reverse"):
            secondary = ["FOREARMS"]
    elif prefix == "TR":
        primary_muscle, secondary = "TRICEPS", ["CHEST"] if contains(n, "bench", "press", "dip", "board", "california", "jm") else []
        role, sub_group = "ELBOW_EXTENSION", "TRICEPS_EXTENSION"
        mechanics = "COMPOUND" if contains(n, "bench", "press", "dip", "board", "california", "jm") else "ISOLATION"
    elif prefix == "FO":
        primary_muscle, secondary = "FOREARMS", []
        role, sub_group, mechanics = "ELBOW_FLEXION", "FOREARM_GRIP", "ISOLATION"
        if contains(n, "farmer", "walk"):
            role, sub_group, mechanics = "LOADED_CARRY", "LOADED_CARRY", "COMPOUND"
            timed, rx = True, "DURATION"
        if contains(n, "hang", "hold"):
            timed, rx = True, "DURATION"
            bodyweight = contains(n, "hang")
    elif prefix == "LE":
        if contains(n, "curl", "nordic"):
            primary_muscle, secondary = "HAMSTRINGS", ["CALVES"]
            role, sub_group, mechanics = "KNEE_FLEXION", "HAMSTRING_KNEE_FLEXION", "ISOLATION"
            if contains(n, "nordic"):
                complexity, beginner, bodyweight = "HIGH", False, True
                loading, equipment, locations = "BODYWEIGHT", [], ["GYM", "HOME"]
        elif contains(n, "extension", "sissy", "terminal knee"):
            primary_muscle, secondary = "QUADRICEPS", []
            role, sub_group, mechanics = "KNEE_EXTENSION", "QUAD_KNEE_EXTENSION", "ISOLATION"
            if contains(n, "sissy"):
                complexity, beginner = "HIGH", False
        elif contains(n, "adductor"):
            primary_muscle, secondary = "ADDUCTORS", []
            role, sub_group, mechanics = "HIP_ADDUCTION", "HIP_ADDUCTION", "ISOLATION"
        elif contains(n, "wall sit"):
            primary_muscle, secondary = "QUADRICEPS", ["GLUTES"]
            role, sub_group, mechanics = "SQUAT", "SQUAT_PATTERN", "COMPOUND"
            timed, rx, bodyweight = True, "DURATION", True
            loading, equipment, locations = "BODYWEIGHT", [], ["GYM", "HOME", "NO_EQUIPMENT"]
        elif contains(n, "lunge", "split", "step", "bulgarian", "pistol", "curtsy"):
            primary_muscle, secondary = "QUADRICEPS", ["GLUTES", "HAMSTRINGS"]
            role, sub_group, mechanics = "SQUAT", "LUNGE_SPLIT", "COMPOUND"
            unilateral, sides = True, "LEFT_RIGHT_SEPARATE"
            if contains(n, "pistol"):
                complexity, beginner, bodyweight = "HIGH", False, True
        else:
            primary_muscle, secondary = "QUADRICEPS", ["GLUTES", "HAMSTRINGS"]
            role, sub_group, mechanics = "SQUAT", "SQUAT_PATTERN", "COMPOUND"
            if contains(n, "overhead squat"):
                complexity, beginner = "HIGH", False
    elif prefix == "GL":
        primary_muscle, secondary = "GLUTES", ["HAMSTRINGS"]
        if contains(n, "abduction", "fire hydrant", "clamshell", "lateral", "monster"):
            primary_muscle, secondary = "GLUTEUS_MEDIUS", ["GLUTES"]
            role, sub_group, mechanics = "HIP_ABDUCTION", "HIP_ABDUCTION", "ISOLATION"
        elif contains(n, "squat", "step"):
            primary_muscle, secondary = "GLUTES", ["QUADRICEPS"]
            role, sub_group, mechanics = "SQUAT", "SQUAT_PATTERN", "COMPOUND"
        elif contains(n, "swing"):
            role, sub_group, mechanics = "HINGE", "HINGE_POSTERIOR_CHAIN", "COMPOUND"
        elif contains(n, "ham raise"):
            primary_muscle, secondary = "HAMSTRINGS", ["GLUTES"]
            role, sub_group, mechanics = "KNEE_FLEXION", "HAMSTRING_KNEE_FLEXION", "COMPOUND"
            complexity, beginner = "HIGH", False
        else:
            role, sub_group, mechanics = "HIP_EXTENSION", "GLUTE_HIP_EXTENSION", "COMPOUND" if contains(n, "thrust", "bridge", "pull through") else "ISOLATION"
    elif prefix == "CA":
        primary_muscle, secondary = "CALVES", []
        role, sub_group, mechanics = "CALF_RAISE", "CALF_RAISE", "ISOLATION"
        if contains(n, "tibialis"):
            primary_muscle = "CALVES"
        if contains(n, "isometric", "hold"):
            timed, rx = True, "DURATION"
        if contains(n, "single"):
            unilateral, sides = True, "LEFT_RIGHT_SEPARATE"
    elif prefix == "AB":
        primary_muscle = "CORE"
        if contains(n, "side plank", "copenhagen", "oblique"):
            primary_muscle, secondary = "OBLIQUES", ["CORE"]
            role, sub_group = "LATERAL_STABILITY", "CORE_LATERAL"
        elif contains(n, "plank", "dead bug", "hollow", "l-sit", "ab wheel", "stir", "bear"):
            primary_muscle, secondary = "RECTUS_ABDOMINIS", ["CORE"]
            role, sub_group = "ANTI_EXTENSION", "CORE_ANTI_EXTENSION"
        elif contains(n, "pallof"):
            primary_muscle, secondary = "OBLIQUES", ["CORE"]
            role, sub_group = "ANTI_ROTATION", "CORE_ANTI_ROTATION"
        elif contains(n, "russian", "wood chop", "windshield", "twist"):
            primary_muscle, secondary = "OBLIQUES", ["CORE"]
            role, sub_group = "ANTI_ROTATION", "CORE_ANTI_ROTATION"
        else:
            primary_muscle, secondary = "RECTUS_ABDOMINIS", ["CORE"]
            role, sub_group = "TRUNK_FLEXION", "CORE_FLEXION"
        mechanics = "ISOLATION"
        if contains(n, "plank", "hollow hold", "l-sit", "copenhagen"):
            timed, rx = True, "DURATION"
            bodyweight = True
        if contains(n, "hanging"):
            equipment = ["PULL_UP_BAR"]
            locations = ["GYM", "HOME"]
            bodyweight = True
        if contains(n, "dragon"):
            complexity, beginner = "HIGH", False
    elif prefix == "WU":
        primary_muscle, secondary = "FULL_BODY", []
        role, sub_group, mechanics = "WARMUP", "WARMUP", "NOT_APPLICABLE"
        rx, timed = "DURATION", True
        complexity, beginner = "LOW", True
        if contains(n, "jog", "jack", "knees", "kicks"):
            role, conditioning = "LOCOMOTION", "BODYWEIGHT_CONDITIONING"
        if contains(n, "squat"):
            primary_muscle, role = "QUADRICEPS", "SQUAT"
        if contains(n, "scapular"):
            primary_muscle, role, secondary_roles = "UPPER_BACK", "SCAPULAR_CONTROL", ["WARMUP"]
    elif prefix == "MO":
        primary_muscle, secondary = "FULL_BODY", []
        role, sub_group, mechanics = "MOBILITY", "MOBILITY", "NOT_APPLICABLE"
        rx, timed = "DURATION", True
        complexity, beginner = "LOW", True
        if contains(n, "hip", "pigeon", "cossack", "90"):
            primary_muscle = "HIP_FLEXORS"
        if contains(n, "hamstring"):
            primary_muscle = "HAMSTRINGS"
        if contains(n, "quad"):
            primary_muscle = "QUADRICEPS"
        if contains(n, "shoulder", "thoracic", "wall slide", "pec"):
            primary_muscle = "SHOULDERS"
        if contains(n, "wall slide", "scapular"):
            secondary_roles = ["SCAPULAR_CONTROL"]
        if contains(n, "jefferson"):
            complexity = "MODERATE"
    elif prefix == "CR":
        primary_muscle, secondary = "FULL_BODY", []
        mechanics = "NOT_APPLICABLE"
        if contains(n, "run", "jog", "walk", "sprint"):
            role = "LOCOMOTION"
            conditioning = "INTERVAL_CAPABLE" if contains(n, "sprint", "interval") else "STEADY_CARDIO"
            rx = "DISTANCE" if contains(n, "run") else "DURATION"
            timed = True
        elif contains(n, "bike", "cycle", "row", "elliptical", "stair", "ski", "climber"):
            role, conditioning, rx, timed = "STEADY_CARDIO", "CYCLICAL_CONDITIONING", "DURATION", True
        elif contains(n, "jump rope", "burpee", "mountain", "battle", "hiit", "tabata", "box"):
            role, conditioning, rx, timed = "INTERVAL_CONDITIONING", "INTERVAL_CAPABLE", "INTERVAL", True
            if contains(n, "burpee", "mountain"):
                bodyweight, loading, equipment, locations = True, "BODYWEIGHT", [], ["GYM", "HOME", "NO_EQUIPMENT"]
            if contains(n, "jump rope"):
                loading, equipment, locations = "OTHER", ["JUMP_ROPE"], ["GYM", "HOME"]
            if contains(n, "battle"):
                loading, equipment, locations = "OTHER", ["BATTLE_ROPES"], ["GYM"]
        elif contains(n, "sled"):
            role, conditioning, rx, timed = "LOCOMOTION", "INTERVAL_CAPABLE", "DISTANCE", True
            loading, equipment, locations = "OTHER", ["SLED"], ["GYM"]
        elif contains(n, "swim", "aqua"):
            role, conditioning, rx, timed = "LOCOMOTION", "STEADY_CARDIO", "DURATION", True
            loading, equipment, locations = "OTHER", ["POOL"], ["GYM"]
        else:
            role, conditioning, rx, timed = "INTERVAL_CONDITIONING", "CIRCUIT_CAPABLE", "INTERVAL", True
        sub_group = "CONDITIONING"
        if contains(n, "hiit", "tabata", "circuit"):
            beginner = True
            complexity = "MODERATE"

    if contains(n, "pull up", "chin up", "inverted row", "dead hang", "hanging") and not contains(n, "assisted"):
        bodyweight = True
        loading = "BODYWEIGHT"
        equipment = list(dict.fromkeys((equipment or []) + ["PULL_UP_BAR"]))
        locations = ["GYM", "HOME"]
    if contains(n, "chest dip", "tricep dip") and not contains(n, "bench dip"):
        bodyweight = True
        loading = "BODYWEIGHT"
        equipment = list(dict.fromkeys((equipment or []) + ["PARALLEL_BARS"]))
        locations = ["GYM", "HOME"]
    if contains(n, "push up") and not equipment:
        bodyweight = True
        loading = "BODYWEIGHT"
        locations = ["GYM", "HOME", "NO_EQUIPMENT"]

    if loading == "OTHER" and prefix not in {"WU", "MO", "CR"}:
        if contains(
            n,
            "bench press",
            "overhead press",
            "deadlift",
            "rack pull",
            "good morning",
            "back squat",
            "front squat",
            "box squat",
            "pause squat",
            "wide stance squat",
            "narrow stance squat",
            "tempo squat",
            "anderson squat",
            "pin squat",
            "zercher",
            "safety bar",
            "hatfield",
            "jefferson squat",
            "hip thrust",
            "pendlay",
            "t-bar",
            "meadows",
            "seal row",
            "barbell",
            "ez bar",
            "skull crusher",
            "jm press",
            "board press",
            "california press",
            "close grip bench",
            "floor press",
            "squat",
        ) and not contains(n, "dumbbell", "machine", "smith", "cable", "bodyweight", "goblet", "sissy", "pistol", "cossack", "wall sit"):
            loading, equipment, locations = "BARBELL", ["BARBELL"], ["GYM"]
            if contains(n, "bench", "skull", "hip thrust", "floor press"):
                equipment = ["BARBELL", "BENCH"]
        elif contains(n, "goblet"):
            loading, equipment, locations = "DUMBBELL", ["DUMBBELLS"], ["GYM", "HOME"]
        elif contains(n, "fly", "raise", "curl", "kickback", "lunge", "split squat", "step up", "step down") and not contains(n, "cable", "machine", "band"):
            loading, equipment, locations = "DUMBBELL", ["DUMBBELLS"], ["GYM", "HOME"]
        elif contains(
            n,
            "leg extension",
            "leg curl",
            "leg press",
            "hack squat",
            "adductor",
            "abduction",
            "pendulum",
            "belt squat",
            "calf raise",
            "lat pulldown",
        ) and not contains(n, "nordic", "sissy", "single leg calf", "bodyweight"):
            loading, equipment, locations = "SELECTORIZED_MACHINE", ["MACHINE"], ["GYM"]
        elif contains(n, "glute bridge", "frog pump", "fire hydrant", "clamshell", "donkey kick", "plank", "crunch", "sit up"):
            loading, equipment, locations = "BODYWEIGHT", [], ["GYM", "HOME", "NO_EQUIPMENT"]
            bodyweight = True
        elif contains(n, "dip"):
            loading = "BODYWEIGHT"
            bodyweight = True
            if contains(n, "bench dip"):
                equipment, locations = ["BENCH"], ["GYM", "HOME"]
            else:
                equipment, locations = ["PARALLEL_BARS"], ["GYM", "HOME"]

    if loading == "OTHER":
        if contains(n, "pulldown", "pushdown", "face pull", "wood chop"):
            loading, equipment, locations = "CABLE", ["CABLE_STATION"], ["GYM"]
        elif contains(n, "arnold", "tate press", "bus driver", "half kneeling"):
            loading, equipment, locations = "DUMBBELL", ["DUMBBELLS"], ["GYM", "HOME"]
        elif contains(n, "push press", "bradford", "viking", "upright row", "cuban"):
            loading, equipment, locations = "BARBELL", ["BARBELL"], ["GYM"]
        elif contains(n, "chest supported", "hyperextension"):
            loading, equipment, locations = "MACHINE", ["MACHINE"], ["GYM"]
        elif contains(n, "farmer"):
            loading, equipment, locations = "DUMBBELL", ["DUMBBELLS"], ["GYM", "HOME"]
        elif contains(n, "monster walk", "lateral walk"):
            loading, equipment, locations = "BAND", ["RESISTANCE_BAND"], ["GYM", "HOME"]
        elif contains(n, "ab wheel"):
            loading, equipment, locations = "OTHER", ["AB_WHEEL"], ["GYM", "HOME"]
        elif contains(n, "sissy", "terminal knee"):
            loading, equipment, locations = "BODYWEIGHT" if contains(n, "sissy") else "BAND", ["RESISTANCE_BAND"] if contains(n, "terminal") else [], ["GYM", "HOME"]
            if contains(n, "sissy"):
                bodyweight, locations = True, ["GYM", "HOME", "NO_EQUIPMENT"]
        elif contains(n, "overhead tricep"):
            loading, equipment, locations = "DUMBBELL", ["DUMBBELLS"], ["GYM", "HOME"]
        elif contains(n, "wrist roller", "gripper", "sledgehammer", "fat grip", "thick bar", "rack hold", "towel grip"):
            loading, equipment, locations = "OTHER", ["GRIP_IMPLEMENT"], ["GYM"]
        elif contains(n, "isometric calf"):
            loading, equipment, locations = "BODYWEIGHT", [], ["GYM", "HOME", "NO_EQUIPMENT"]
            bodyweight = True

    if loading == "BODYWEIGHT" and not equipment:
        locations = ["GYM", "HOME", "NO_EQUIPMENT"] if "NO_EQUIPMENT" not in locations else locations

    if rx == "DURATION":
        timed = True

    contributions = [{"muscle": primary_muscle, "contribution": "DIRECT_PRIMARY"}]
    for m in secondary:
        contributions.append({"muscle": m, "contribution": "DIRECT_SECONDARY"})

    if mechanics == "COMPOUND" and complexity == "MODERATE" and prefix in {"BA", "LE"} and contains(n, "deadlift", "squat", "overhead"):
        if contains(n, "conventional", "front squat", "overhead", "snatch", "good morning"):
            complexity = "HIGH"
            beginner = contains(n, "goblet", "leg press", "hack") or beginner and not contains(n, "overhead", "good morning", "conventional")

    if prefix in {"WU", "MO"}:
        beginner = True
        complexity = "LOW"

    equipment_state = "NO_EQUIPMENT" if not equipment else "HAS_EQUIPMENT"
    status = "REVIEW_REQUIRED" if eid in LOW_CONFIDENCE else "APPROVED"

    # complexity mapping to legacy difficulty
    difficulty = {"LOW": "beginner", "MODERATE": "intermediate", "HIGH": "advanced"}[complexity]

    return {
        "external_id": eid,
        "name_en": name,
        "name_ar": item["name_ar"],
        "group": group,
        "exercise_type": exercise_type,
        "primary_muscle_canonical": primary_muscle,
        "secondary_muscles_canonical": secondary,
        "muscle_contributions": contributions,
        "primary_movement_role": role,
        "secondary_movement_roles": secondary_roles,
        "substitution_group": sub_group,
        "mechanics": mechanics,
        "loading_type": loading,
        "required_equipment": equipment,
        "equipment_state": equipment_state,
        "location_compatibility": locations,
        "is_bodyweight": bodyweight,
        "is_unilateral": unilateral,
        "execution_sides": sides,
        "supports_timed_prescription": timed,
        "prescription_mode": rx,
        "conditioning_class": conditioning,
        "complexity": complexity,
        "beginner_eligible": beginner,
        "difficulty": difficulty,
        "v2_metadata_status": status,
        "legacy_equipment_label": equipment[0] if equipment else "NO_EQUIPMENT",
    }


def patch_catalog(catalog: dict, records: list[dict]) -> int:
    by_id = {row["external_id"]: row for row in records}
    changed = 0
    for items in catalog.values():
        for item in items:
            meta = by_id[item["id"]]
            equipment = meta["legacy_equipment_label"]
            level = meta["difficulty"]
            if item.get("equipment") != equipment or item.get("level") != level:
                changed += 1
            item["equipment"] = equipment
            item["level"] = level
    return changed


def main() -> None:
    catalog = json.loads(CATALOG.read_text())
    records = []
    for group, items in catalog.items():
        for item in items:
            records.append(classify(group, item))
    OUT.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n")
    changed = patch_catalog(catalog, records)
    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(records)} records to {OUT}")
    print(f"patched equipment/level on {changed} catalog rows")
    from collections import Counter
    print("status", Counter(r["v2_metadata_status"] for r in records))
    print("roles", Counter(r["primary_movement_role"] for r in records).most_common())
    print("muscles", Counter(r["primary_muscle_canonical"] for r in records).most_common())


if __name__ == "__main__":
    main()
