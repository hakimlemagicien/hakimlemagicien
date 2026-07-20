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
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
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
SHARED_PATHS = set(SHARED.values())
PER_EXERCISE_PATH_RE = re.compile(
    r"^exercises/(?P<external_id>[A-Z]{2}-\d{3})/(?P<kind>exercise|instructions)\.mp4$"
)
PLACEHOLDER_ASSET = Path(
    os.environ.get(
        "EXERCISE_PLACEHOLDER_ASSET",
        str(Path.home() / "Documents/Hakim Coaching Platform/Assets/placeholder-exercise.mp4"),
    )
)


def md5_file(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_etag(raw: object) -> str:
    return str(raw or "").strip().strip('"').lower()


def api(method: str, path: str, data=None):
    headers = {"Authorization": f"Bearer {KEY}", "apikey": KEY}
    body = None
    if data is not None:
        body = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{BASE.rstrip('/')}{path}", data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=90) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else None


def list_folders() -> list[str]:
    folders: list[str] = []
    offset = 0
    while True:
        batch = api(
            "POST",
            f"/storage/v1/object/list/{BUCKET}",
            {"prefix": "exercises/", "limit": 1000, "offset": offset},
        )
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


def list_shared_placeholder_objects() -> list[dict]:
    rows: list[dict] = []
    for shared_path in sorted(SHARED_PATHS):
        prefix, _, filename = shared_path.rpartition("/")
        listed = list_objects(f"{prefix}/")
        for obj in listed:
            if str(obj.get("name", "")).strip() == filename:
                meta = obj.get("metadata") or {}
                rows.append(
                    {
                        "path": shared_path,
                        "size": int(meta.get("size") or meta.get("contentLength") or 0),
                        "eTag": normalize_etag(meta.get("eTag")),
                    }
                )
    return rows


def delete_object(path: str) -> None:
    url = f"{BASE.rstrip('/')}/storage/v1/object/{BUCKET}/{urllib.parse.quote(path, safe='/')}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {KEY}", "apikey": KEY}, method="DELETE")
    with urllib.request.urlopen(req, timeout=60):
        return


def db_query(sql: str) -> list[dict]:
    import psycopg

    with psycopg.connect(DB) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            if cur.description is None:
                conn.commit()
                return []
            columns = [desc.name for desc in cur.description]
            return [
                {col: ("" if val is None else str(val)) for col, val in zip(columns, row)}
                for row in cur.fetchall()
            ]


def fetch_db_rows() -> list[dict]:
    if DB:
        return db_query(
            "SELECT external_id, video_status::text AS video_status, "
            "instructions_status::text AS instructions_status, "
            "video_path, instructions_video_path "
            "FROM public.exercises ORDER BY external_id;"
        )

    req = urllib.request.Request(
        f"{BASE.rstrip('/')}/rest/v1/exercises"
        "?select=external_id,video_status,instructions_status,video_path,instructions_video_path"
        "&order=external_id",
        headers={
            "Authorization": f"Bearer {KEY}",
            "apikey": KEY,
            "Accept": "application/json",
        },
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def build_entry(
    *,
    path: str,
    size: int,
    etag: str,
    reference_md5: str | None,
    reference_size: int | None,
    db_by_id: dict[str, dict[str, str]],
) -> dict:
    normalized_etag = normalize_etag(etag)
    hash_match = bool(reference_md5 and normalized_etag == reference_md5.lower())
    size_match = reference_size is not None and size == reference_size

    entry: dict = {
        "path": path,
        "external_id": None,
        "type": None,
        "size": size,
        "eTag": normalized_etag,
        "local_placeholder_md5": reference_md5,
        "hash_match": hash_match,
        "size_match": size_match,
        "deletion_candidate": False,
        "exclusion_reason": None,
        "proposed_action": "keep",
    }

    if path in SHARED_PATHS:
        entry["exclusion_reason"] = "shared_placeholder_protected"
        return entry

    match = PER_EXERCISE_PATH_RE.match(path)
    if not match:
        entry["exclusion_reason"] = "unexpected_path_pattern"
        return entry

    external_id = match.group("external_id")
    media_type = match.group("kind")
    entry["external_id"] = external_id
    entry["type"] = media_type

    db_row = db_by_id.get(external_id, {})
    status_key = "video_status" if media_type == "exercise" else "instructions_status"
    db_status = (db_row.get(status_key) or "").strip()
    if db_status == "ready":
        entry["exclusion_reason"] = "db_status_ready"
        return entry

    if hash_match and size_match:
        entry["deletion_candidate"] = True
        entry["proposed_action"] = "delete_after_qa"
        return entry

    reasons: list[str] = []
    if not hash_match:
        reasons.append("hash_mismatch")
    if not size_match:
        reasons.append("size_mismatch")
    entry["exclusion_reason"] = ",".join(reasons)
    return entry


def validate_before_apply(entries: list[dict], deletion_candidates: list[dict]) -> dict:
    candidate_paths = {item["path"] for item in deletion_candidates}
    entries_by_path = {item["path"]: item for item in entries}

    ready_in_candidates = [
        item["path"]
        for item in deletion_candidates
        if item.get("exclusion_reason") == "db_status_ready"
    ]
    shared_in_candidates = [path for path in candidate_paths if path in SHARED_PATHS]
    unexpected_paths = [
        item["path"]
        for item in deletion_candidates
        if item.get("exclusion_reason") == "unexpected_path_pattern"
    ]
    hash_mismatch = [item["path"] for item in deletion_candidates if not item.get("hash_match")]
    size_mismatch = [item["path"] for item in deletion_candidates if not item.get("size_match")]
    missing_from_manifest = [path for path in candidate_paths if path not in entries_by_path]

    total_bytes = sum(int(item.get("size") or 0) for item in deletion_candidates)
    duplicate_gib = total_bytes / 1024**3

    checks = {
        "deletion_candidate_count": len(deletion_candidates),
        "expected_deletion_candidate_count": 640,
        "deletion_candidate_count_matches_expected": len(deletion_candidates) == 640,
        "total_candidate_bytes": total_bytes,
        "total_candidate_gib": round(duplicate_gib, 2),
        "expected_total_gib_approx": 4.58,
        "ready_in_candidates": ready_in_candidates,
        "shared_in_candidates": shared_in_candidates,
        "unexpected_paths_in_candidates": unexpected_paths,
        "hash_mismatch_in_candidates": hash_mismatch,
        "size_mismatch_in_candidates": size_mismatch,
        "missing_from_manifest": missing_from_manifest,
        "apply_safe": (
            len(deletion_candidates) == 640
            and not ready_in_candidates
            and not shared_in_candidates
            and not unexpected_paths
            and not hash_mismatch
            and not size_mismatch
            and not missing_from_manifest
            and 4.50 <= duplicate_gib <= 4.65
        ),
    }
    return checks


def main() -> int:
    if not BASE or not KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required", file=sys.stderr)
        return 1

    if not PLACEHOLDER_ASSET.is_file():
        print(f"ERROR: placeholder asset not found: {PLACEHOLDER_ASSET}", file=sys.stderr)
        return 1

    reference_md5 = md5_file(PLACEHOLDER_ASSET)
    reference_sha256 = sha256_file(PLACEHOLDER_ASSET)
    reference_size = PLACEHOLDER_ASSET.stat().st_size

    db_rows = fetch_db_rows()
    db_by_id = {row["external_id"]: row for row in db_rows if row.get("external_id")}

    entries: list[dict] = []
    per_exercise_total_bytes = 0

    for folder in list_folders():
        for obj in list_objects(f"exercises/{folder}/"):
            name = str(obj.get("name", "")).strip()
            if not name.endswith(".mp4"):
                continue
            meta = obj.get("metadata") or {}
            size = int(meta.get("size") or meta.get("contentLength") or 0)
            etag = str(meta.get("eTag") or "")
            path = f"exercises/{folder}/{name}"
            per_exercise_total_bytes += size
            entries.append(
                build_entry(
                    path=path,
                    size=size,
                    etag=etag,
                    reference_md5=reference_md5,
                    reference_size=reference_size,
                    db_by_id=db_by_id,
                )
            )

    shared_objects = list_shared_placeholder_objects()
    shared_entries = [
        build_entry(
            path=obj["path"],
            size=int(obj["size"]),
            etag=obj["eTag"],
            reference_md5=reference_md5,
            reference_size=reference_size,
            db_by_id=db_by_id,
        )
        for obj in shared_objects
    ]

    deletion_candidates = [entry for entry in entries if entry["deletion_candidate"]]
    duplicate_paths = [entry["path"] for entry in deletion_candidates]
    duplicate_bytes = sum(int(entry["size"]) for entry in deletion_candidates)
    exclusions = [entry for entry in entries if entry.get("exclusion_reason")]

    pre_apply_checks = validate_before_apply(entries, deletion_candidates)

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "reference_placeholder_asset": str(PLACEHOLDER_ASSET),
        "reference_placeholder_md5": reference_md5,
        "reference_placeholder_sha256": reference_sha256,
        "reference_placeholder_size_bytes": reference_size,
        "shared_placeholder_paths": SHARED,
        "listing_scope": {
            "per_exercise_objects": len(entries),
            "shared_placeholder_objects": len(shared_entries),
            "note": (
                "objects/duplicate_count in CLI summary refer to per-exercise paths only "
                "(exercises/{external_id}/*.mp4). Shared placeholders are listed separately "
                "and are always excluded from deletion."
            ),
        },
        "entries": entries,
        "shared_placeholder_entries": shared_entries,
        "exclusions": exclusions,
        "deletion_candidates": deletion_candidates,
        "storage_object_count": len(entries),
        "storage_total_bytes": per_exercise_total_bytes,
        "duplicate_placeholder_paths": duplicate_paths,
        "duplicate_placeholder_count": len(deletion_candidates),
        "duplicate_placeholder_bytes": duplicate_bytes,
        "potential_savings_bytes": duplicate_bytes,
        "estimated_bytes_after_cleanup": per_exercise_total_bytes - duplicate_bytes,
        "database_rows": db_rows,
        "pre_apply_validation": pre_apply_checks,
        "apply_mode": APPLY,
    }

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Manifest written: {MANIFEST}")
    print(
        json.dumps(
            {
                "objects": len(entries),
                "shared_placeholder_objects": len(shared_entries),
                "duplicate_count": len(deletion_candidates),
                "total_gib": round(per_exercise_total_bytes / 1024**3, 2),
                "duplicate_gib": round(duplicate_bytes / 1024**3, 2),
                "potential_savings_gib": round(duplicate_bytes / 1024**3, 2),
                "pre_apply_safe": pre_apply_checks["apply_safe"],
            },
            indent=2,
        )
    )

    if exclusions:
        print("EXCLUSIONS")
        for item in exclusions[:20]:
            print(f"- {item['path']}: {item.get('exclusion_reason')}")
        if len(exclusions) > 20:
            print(f"... and {len(exclusions) - 20} more")

    print("PRE_APPLY_VALIDATION")
    print(json.dumps(pre_apply_checks, indent=2))

    if not APPLY:
        print("DRY-RUN only. Re-run with --apply after QA approval.")
        return 0

    if not pre_apply_checks["apply_safe"]:
        print("ERROR: pre-apply validation failed — aborting delete", file=sys.stderr)
        return 1

    if not DB:
        print("ERROR: DATABASE_URL required for --apply", file=sys.stderr)
        return 1

    allowed_paths = {entry["path"] for entry in deletion_candidates}
    deleted: list[str] = []
    for path in duplicate_paths:
        if path not in allowed_paths:
            print(f"ERROR: refusing to delete path not in manifest candidates: {path}", file=sys.stderr)
            return 1
        entry = next(item for item in deletion_candidates if item["path"] == path)
        if path in SHARED_PATHS:
            print(f"ERROR: refusing to delete shared placeholder: {path}", file=sys.stderr)
            return 1
        if not entry.get("deletion_candidate"):
            print(f"ERROR: refusing to delete non-candidate: {path}", file=sys.stderr)
            return 1
        if not entry.get("hash_match") or not entry.get("size_match"):
            print(f"ERROR: refusing to delete hash/size mismatch: {path}", file=sys.stderr)
            return 1
        if entry.get("exclusion_reason") == "db_status_ready":
            print(f"ERROR: refusing to delete ready asset: {path}", file=sys.stderr)
            return 1
        if not PER_EXERCISE_PATH_RE.match(path):
            print(f"ERROR: refusing to delete unexpected path: {path}", file=sys.stderr)
            return 1

    db_query(
        "UPDATE public.exercises SET "
        "video_status = 'placeholder'::public.exercise_media_status, "
        "video_path = NULL, "
        "instructions_status = 'placeholder'::public.exercise_media_status, "
        "instructions_video_path = NULL "
        "WHERE video_status = 'ready'::public.exercise_media_status "
        "AND video_path LIKE 'exercises/%/exercise.mp4';"
    )

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
