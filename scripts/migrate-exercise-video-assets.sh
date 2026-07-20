#!/usr/bin/env bash
# migrate-exercise-video-assets.sh
#
# CEO-approved migration: shared placeholder · deduplicate Storage · safe manifest.
# Read-only by default. Use --apply only after QA sign-off.
#
# Usage:
#   ./scripts/migrate-exercise-video-assets.sh                 # report only
#   ./scripts/migrate-exercise-video-assets.sh --apply         # execute migration
#   ./scripts/migrate-exercise-video-assets.sh --manifest out.json

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
APPLY=0
MANIFEST="${ROOT_DIR}/docs/exercise-video-migration-manifest.json"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=1; shift ;;
    --manifest)
      [[ $# -ge 2 ]] || { echo "ERROR: --manifest requires path" >&2; exit 1; }
      MANIFEST="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

load_env_file() {
  local env_file="$1"
  [[ -f "$env_file" ]] || return 0
  set -a
  # shellcheck disable=SC1091
  source "$env_file"
  set +a
}

load_env_file "${ROOT_DIR}/.env"
load_env_file "${ROOT_DIR}/.env.local"

export ROOT_DIR APPLY MANIFEST
python3 - <<'PY'
import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(os.environ["ROOT_DIR"])
APPLY = os.environ.get("APPLY", "0") == "1"
MANIFEST = Path(os.environ["MANIFEST"])
BASE = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or ""
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SECRET_KEY") or ""
DB = os.environ.get("DATABASE_URL", "")
BUCKET = "exercise-media"
SHARED = {
    "exercise": "exercises/placeholders/default-exercise.mp4",
    "instructions": "exercises/placeholders/default-instructions.mp4",
}
PLACEHOLDER_ASSET = Path(
    os.environ.get(
        "EXERCISE_PLACEHOLDER_ASSET",
        str(Path.home() / "Documents/Hakim Coaching Platform/Assets/placeholder-exercise.mp4"),
    )
)

def sha256_bytes(data: bytes) -> str:
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def api(method: str, path: str, data=None):
    headers = {"Authorization": f"Bearer {KEY}", "apikey": KEY}
    body = None
    if data is not None:
        body = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{BASE.rstrip('/')}{path}", data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else None

def list_folders() -> list[str]:
    folders = []
    offset = 0
    while True:
        batch = api("POST", f"/storage/v1/object/list/{BUCKET}", {"prefix": "exercises/", "limit": 1000, "offset": offset})
        if not batch:
            break
        for item in batch:
            name = str(item.get("name", "")).strip()
            if name and not name.endswith(".mp4") and name != "placeholders":
                folders.append(name)
        if len(batch) < 1000:
            break
        offset += 1000
    return sorted(set(folders))

def list_objects(prefix: str) -> list[dict]:
    return api("POST", f"/storage/v1/object/list/{BUCKET}", {"prefix": prefix, "limit": 100, "offset": 0}) or []

def delete_object(path: str) -> None:
    url = f"{BASE.rstrip('/')}/storage/v1/object/{BUCKET}/{urllib.parse.quote(path, safe='/')}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {KEY}", "apikey": KEY}, method="DELETE")
    with urllib.request.urlopen(req, timeout=60):
        return

def db_query(sql: str) -> list[dict]:
    try:
        import psycopg
    except ImportError as exc:
        raise RuntimeError("psycopg required for DB updates") from exc
    with psycopg.connect(DB) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            if cur.description is None:
                conn.commit()
                return []
            cols = [d.name for d in cur.description]
            return [{c: ("" if v is None else str(v)) for c, v in zip(cols, row)} for row in cur.fetchall()]

def main() -> int:
    if not BASE or not KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required", file=sys.stderr)
        return 1

    reference_hash = sha256_file(PLACEHOLDER_ASSET) if PLACEHOLDER_ASSET.is_file() else None
    rows = []
    total_bytes = 0
    duplicate_bytes = 0
    duplicate_paths: list[str] = []

    for folder in list_folders():
        for obj in list_objects(f"exercises/{folder}/"):
            name = str(obj.get("name", "")).strip()
            if not name.endswith(".mp4"):
                continue
            meta = obj.get("metadata") or {}
            size = int(meta.get("size") or meta.get("contentLength") or 0)
            etag = str(meta.get("eTag") or "").strip('"')
            path = f"exercises/{folder}/{name}"
            total_bytes += size
            rows.append({
                "external_id": folder,
                "path": path,
                "size": size,
                "etag": etag,
                "kind": "exercise" if name == "exercise.mp4" else "instructions",
            })
            if reference_hash and etag and etag == reference_hash[:32]:
                duplicate_paths.append(path)
                duplicate_bytes += size

    db_rows = []
    if DB:
        db_rows = db_query(
            "SELECT external_id, video_status::text, instructions_status::text, "
            "video_path, instructions_video_path FROM public.exercises ORDER BY external_id;"
        )

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "reference_placeholder_asset": str(PLACEHOLDER_ASSET),
        "reference_placeholder_sha256": reference_hash,
        "shared_placeholder_paths": SHARED,
        "storage_objects": rows,
        "storage_object_count": len(rows),
        "storage_total_bytes": total_bytes,
        "duplicate_placeholder_paths": duplicate_paths,
        "duplicate_placeholder_count": len(duplicate_paths),
        "duplicate_placeholder_bytes": duplicate_bytes,
        "estimated_bytes_after_cleanup": total_bytes - duplicate_bytes + sum(
            0 for _ in SHARED
        ),
        "database_rows": db_rows,
        "apply_mode": APPLY,
    }

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Manifest written: {MANIFEST}")
    print(json.dumps({
        "objects": len(rows),
        "total_gib": round(total_bytes / 1024**3, 2),
        "duplicate_count": len(duplicate_paths),
        "duplicate_gib": round(duplicate_bytes / 1024**3, 2),
        "potential_savings_gib": round(duplicate_bytes / 1024**3, 2),
    }, indent=2))

    if not APPLY:
        print("DRY-RUN only. Re-run with --apply after QA approval.")
        return 0

    if not DB:
        print("ERROR: DATABASE_URL required for --apply", file=sys.stderr)
        return 1

    # Phase 5: reset placeholder exercises in DB (NULL paths + placeholder status)
    db_query(
        "UPDATE public.exercises SET "
        "video_status = 'placeholder'::public.exercise_media_status, "
        "video_path = NULL, "
        "instructions_status = 'placeholder'::public.exercise_media_status, "
        "instructions_video_path = NULL "
        "WHERE video_status = 'ready'::public.exercise_media_status "
        "AND video_path LIKE 'exercises/%/exercise.mp4';"
    )

    deleted = []
    for path in duplicate_paths:
        try:
            delete_object(path)
            deleted.append(path)
        except urllib.error.HTTPError as exc:
            print(f"WARN delete failed {path}: HTTP {exc.code}", file=sys.stderr)

    manifest["deleted_paths"] = deleted
    manifest["deleted_at"] = datetime.now(timezone.utc).isoformat()
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Deleted {len(deleted)} duplicate placeholder object(s)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
PY
