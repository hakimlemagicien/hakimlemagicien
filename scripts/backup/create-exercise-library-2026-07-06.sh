#!/usr/bin/env bash
# create-exercise-library.sh
#
# Reads exercise-library.json and creates the Exercise Library folder structure
# under ~/Documents/Hakim Coaching Platform/Exercise Library
#
# Safe / idempotent:
#   - Never deletes existing files or folders
#   - Never replaces existing exercise.mp4 or instructions.mp4
#   - Never modifies existing metadata.json
#   - Does not create thumbnail.jpg
#
# Usage:
#   ./scripts/create-exercise-library.sh
#   ./scripts/create-exercise-library.sh --json /path/to/exercise-library.json
#   ./scripts/create-exercise-library.sh --dry-run

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_JSON="${SCRIPT_DIR}/exercise-library.json"

PLATFORM_ROOT="${HOME}/Documents/Hakim Coaching Platform"
LIBRARY_ROOT="${PLATFORM_ROOT}/Exercise Library"
PLACEHOLDER_VIDEO="${PLATFORM_ROOT}/Assets/placeholder-exercise.mp4"

JSON_PATH="${DEFAULT_JSON}"
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage: create-exercise-library.sh [options]

Options:
  --json PATH     Path to exercise-library.json (default: scripts/exercise-library.json)
  --dry-run       Print actions without creating files or copying videos
  -h, --help      Show this help

Output:
  ~/Documents/Hakim Coaching Platform/Exercise Library/<Muscle>/<ID>-<slug>/
    exercise.mp4       (from placeholder, only if missing)
    instructions.mp4   (from placeholder, only if missing)
    metadata.json      (only if missing)
EOF
}

log() {
  printf '[exercise-library] %s\n' "$*"
}

warn() {
  printf '[exercise-library] WARNING: %s\n' "$*" >&2
}

die() {
  printf '[exercise-library] ERROR: %s\n' "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json)
      [[ $# -ge 2 ]] || die "--json requires a path"
      JSON_PATH="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1 (use --help)"
      ;;
  esac
done

[[ -f "$JSON_PATH" ]] || die "JSON file not found: $JSON_PATH"
[[ -f "$PLACEHOLDER_VIDEO" ]] || die "Placeholder video not found: $PLACEHOLDER_VIDEO"

command -v python3 >/dev/null 2>&1 || die "python3 is required but not found in PATH"

read -r -d '' PYTHON_PARSER <<'PY' || true
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

MUSCLE_PREFIXES = {
    "chest": "CH",
    "back": "BA",
    "shoulders": "SH",
    "biceps": "BI",
    "triceps": "TR",
    "legs": "LG",
    "glutes": "GL",
    "core": "CO",
    "cardio": "CA",
    "forearms": "FO",
    "calves": "CV",
    "traps": "TP",
    "abs": "AB",
}


def muscle_prefix(muscle: str) -> str:
    key = muscle.strip().lower()
    if key in MUSCLE_PREFIXES:
        return MUSCLE_PREFIXES[key]
    cleaned = re.sub(r"[^a-zA-Z]", "", muscle)
    if len(cleaned) >= 2:
        return cleaned[:2].upper()
    return (cleaned + "XX")[:2].upper()


def slugify(name: str) -> str:
    slug = name.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug or "exercise"


def parse_order(exercise_id: str) -> int:
    suffix = exercise_id.rsplit("-", 1)[-1]
    if suffix.isdigit():
        return int(suffix)
    return 0


def load_exercises(json_path: Path):
    with json_path.open(encoding="utf-8") as fh:
        data = json.load(fh)

    if not isinstance(data, dict):
        raise ValueError("JSON root must be an object mapping muscle groups to exercise arrays")

    exercises = []
    for muscle, items in data.items():
        if not isinstance(muscle, str) or not muscle.strip():
            raise ValueError("Muscle group names must be non-empty strings")
        if not isinstance(items, list) or not items:
            raise ValueError(f"Muscle group '{muscle}' must be a non-empty array")
        for item in items:
            if not isinstance(item, dict):
                raise ValueError(f"Each exercise under '{muscle}' must be an object")
            exercise_id = str(item.get("id", "")).strip()
            name = str(item.get("name", "")).strip()
            if not exercise_id or not name:
                raise ValueError(f"Exercise under '{muscle}' requires non-empty 'id' and 'name'")
            exercises.append((muscle.strip(), item))
    return exercises


def main() -> int:
    if len(sys.argv) != 5:
        print("usage: python <json> <library_root> <placeholder> <dry_run:0|1>", file=sys.stderr)
        return 2

    json_path = Path(sys.argv[1])
    library_root = Path(sys.argv[2])
    placeholder = Path(sys.argv[3])
    dry_run = sys.argv[4] == "1"

    exercises = load_exercises(json_path)

    created_dirs = 0
    created_metadata = 0
    copied_exercise = 0
    copied_instructions = 0
    skipped_existing = 0

    for muscle, record in exercises:
        exercise_id = str(record["id"]).strip()
        name = str(record["name"]).strip()
        slug = slugify(name)
        folder_name = f"{exercise_id}-{slug}"
        exercise_dir = library_root / muscle / folder_name

        if not dry_run:
            exercise_dir.mkdir(parents=True, exist_ok=True)
        else:
            print(f"MKDIR {exercise_dir}")
        created_dirs += 1

        metadata_path = exercise_dir / "metadata.json"
        if metadata_path.exists():
            print(f"SKIP metadata (exists): {metadata_path}")
            skipped_existing += 1
        elif dry_run:
            print(f"CREATE metadata: {metadata_path}")
            created_metadata += 1
        else:
            now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
            metadata = {
                "id": exercise_id,
                "slug": slug,
                "name": name,
                "name_ar": record.get("name_ar") or "",
                "primary_muscle": muscle,
                "secondary_muscles": [],
                "equipment": record.get("equipment") or "",
                "difficulty": record.get("level") or "",
                "exercise_type": "",
                "video_status": record.get("status") or "placeholder",
                "instructions_status": "placeholder",
                "duration_seconds": 30,
                "youtube_url": "",
                "coach_notes": "",
                "created_at": now,
                "updated_at": now,
            }
            metadata_path.write_text(
                json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            print(f"CREATE metadata: {metadata_path}")
            created_metadata += 1

        for target_name in ("exercise.mp4", "instructions.mp4"):
            target_path = exercise_dir / target_name
            if target_path.exists():
                print(f"SKIP video (exists): {target_path}")
                skipped_existing += 1
                continue

            if dry_run:
                print(f"COPY {placeholder} -> {target_path}")
            else:
                target_path.write_bytes(placeholder.read_bytes())
                print(f"COPY {placeholder} -> {target_path}")

            if target_name == "exercise.mp4":
                copied_exercise += 1
            else:
                copied_instructions += 1

    print("---")
    print(f"exercises_processed={len(exercises)}")
    print(f"folders_touched={created_dirs}")
    print(f"metadata_created={created_metadata}")
    print(f"exercise_mp4_copied={copied_exercise}")
    print(f"instructions_mp4_copied={copied_instructions}")
    print(f"skipped_existing={skipped_existing}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
PY

log "JSON:              ${JSON_PATH}"
log "Library root:      ${LIBRARY_ROOT}"
log "Placeholder video: ${PLACEHOLDER_VIDEO}"
[[ "$DRY_RUN" -eq 1 ]] && log "Mode:              dry-run (no writes)"

if [[ "$DRY_RUN" -eq 0 ]]; then
  mkdir -p "${LIBRARY_ROOT}"
fi

python3 -c "$PYTHON_PARSER" "$JSON_PATH" "$LIBRARY_ROOT" "$PLACEHOLDER_VIDEO" "$DRY_RUN"

log "Done."
