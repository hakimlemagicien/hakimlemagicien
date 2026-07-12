#!/usr/bin/env bash
# sync-videos.sh
#
# Upload Exercise Library videos to Supabase storage (exercise-media) and update
# public.exercises media columns. Idempotent via SHA-256 content hashes.
#
# Storage uploads use SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY only.
# DATABASE_URL is used for public.exercises reads/writes only.
#
# Usage:
#   ./scripts/sync-videos.sh --dry-run
#   ./scripts/sync-videos.sh --exercise CH-001
#   ./scripts/sync-videos.sh --library "/path/to/Exercise Library"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_LIBRARY="${HOME}/Documents/Hakim Coaching Platform/Exercise Library"

LIBRARY_ROOT="${DEFAULT_LIBRARY}"
DRY_RUN=0
EXERCISE_FILTER=""

usage() {
  cat <<'EOF'
Usage: sync-videos.sh [options]

Options:
  --library PATH     Exercise Library root
  --dry-run          Compare and report without uploading or updating
  --exercise ID      Sync a single exercise only (e.g. CH-001); verifies Storage + DB
  -h, --help         Show this help

Environment (.env then .env.local):
  SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY   Required for uploads (Storage REST API)
  DATABASE_URL / SUPABASE_DB_PASSWORD       Required for DB updates

Report:
  uploaded / updated / skipped / errors
  (--dry-run reports would_upload instead of uploaded)
EOF
}

log() {
  printf '[sync-videos] %s\n' "$*"
}

die() {
  printf '[sync-videos] ERROR: %s\n' "$*" >&2
  exit 1
}

load_env_file() {
  local env_file="$1"
  [[ -f "$env_file" ]] || return 0
  set -a
  # shellcheck disable=SC1091
  source "$env_file"
  set +a
}

resolve_database_url() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    return 0
  fi

  DATABASE_URL="${SUPABASE_DB_URL:-}"
  [[ -n "${DATABASE_URL:-}" ]] && return 0

  local password="${SUPABASE_DB_PASSWORD:-${DB_PASSWORD:-${POSTGRES_PASSWORD:-}}}"
  [[ -n "$password" ]] || return 0

  local project_ref="${SUPABASE_PROJECT_ID:-${VITE_SUPABASE_PROJECT_ID:-}}"
  if [[ -z "$project_ref" && -f "${ROOT_DIR}/supabase/.temp/project-ref" ]]; then
    project_ref="$(tr -d '[:space:]' < "${ROOT_DIR}/supabase/.temp/project-ref")"
  fi
  if [[ -z "$project_ref" && -n "${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}" ]]; then
    project_ref="$(printf '%s' "${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')"
  fi
  [[ -n "$project_ref" ]] || return 0

  local pooler_url=""
  if [[ -f "${ROOT_DIR}/supabase/.temp/pooler-url" ]]; then
    pooler_url="$(tr -d '[:space:]' < "${ROOT_DIR}/supabase/.temp/pooler-url")"
  else
    pooler_url="postgresql://postgres.${project_ref}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
  fi

  DATABASE_URL="$(
    SUPABASE_DB_PASSWORD="$password" POOLER_URL="$pooler_url" python3 - <<'PY'
import os
from urllib.parse import quote, urlparse, urlunparse

password = os.environ["SUPABASE_DB_PASSWORD"]
parsed = urlparse(os.environ["POOLER_URL"])
username = parsed.username or "postgres"
host = parsed.hostname or ""
port = parsed.port or 5432
database = (parsed.path or "/postgres").lstrip("/") or "postgres"
netloc = f"{quote(username, safe='')}:{quote(password, safe='')}@{host}:{port}"
print(urlunparse(("postgresql", netloc, f"/{database}", "", "", "")))
PY
  )"
  export DATABASE_URL
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --library)
      [[ $# -ge 2 ]] || die "--library requires a path"
      LIBRARY_ROOT="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --exercise)
      [[ $# -ge 2 ]] || die "--exercise requires an external_id"
      EXERCISE_FILTER="$2"
      shift 2
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

[[ -d "$LIBRARY_ROOT" ]] || die "Exercise Library not found: $LIBRARY_ROOT"

load_env_file "${ROOT_DIR}/.env"
load_env_file "${ROOT_DIR}/.env.local"

: "${SUPABASE_URL:=${VITE_SUPABASE_URL:-}}"
: "${SUPABASE_SERVICE_ROLE_KEY:=${SUPABASE_SECRET_KEY:-}}"

resolve_database_url

command -v python3 >/dev/null 2>&1 || die "python3 is required"

if [[ -z "${DATABASE_URL:-}" ]]; then
  die "DATABASE_URL or SUPABASE_DB_PASSWORD is required for DB access"
fi

if [[ "$DRY_RUN" -eq 0 && ( -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ) ]]; then
  die "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for upload (add to .env.local)"
fi

log "Library:   ${LIBRARY_ROOT}"
log "Dry-run:   $([[ "$DRY_RUN" -eq 1 ]] && echo yes || echo no)"
log "Exercise:  ${EXERCISE_FILTER:-all}"
log "Database:  Postgres (DATABASE_URL)"
if [[ "$DRY_RUN" -eq 0 ]]; then
  log "Storage:   Supabase REST (${SUPABASE_URL})"
fi

read -r -d '' PYTHON_SYNC <<'PY' || true
import csv
import hashlib
import json
import mimetypes
import os
import re
import ssl
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

BUCKET = "exercise-media"
EXTERNAL_ID_RE = re.compile(r"^([A-Z]{2}-\d{3})")
MEDIA_FILES = {
    "exercise": {
        "local_name": "exercise.mp4",
        "remote_name": "exercise.mp4",
        "path_column": "video_path",
        "status_column": "video_status",
    },
    "instructions": {
        "local_name": "instructions.mp4",
        "remote_name": "instructions.mp4",
        "path_column": "instructions_video_path",
        "status_column": "instructions_status",
    },
}


def _ssl_context() -> ssl.SSLContext:
    try:
        import certifi  # type: ignore

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


SSL_CONTEXT = _ssl_context()


@dataclass
class Counters:
    uploaded: int = 0
    would_upload: int = 0
    updated: int = 0
    skipped: int = 0
    errors: int = 0


@dataclass
class LocalExercise:
    external_id: str
    directory: Path
    exercise_file: Path | None
    instructions_file: Path | None


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_external_id(directory: Path) -> str | None:
    metadata_path = directory / "metadata.json"
    if metadata_path.exists():
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            value = str(metadata.get("id", "")).strip()
            if value:
                return value
        except json.JSONDecodeError:
            pass

    match = EXTERNAL_ID_RE.match(directory.name)
    return match.group(1) if match else None


def discover_local_exercises(library_root: Path, exercise_filter: str = "") -> list[LocalExercise]:
    rows: list[LocalExercise] = []
    for muscle_dir in sorted(library_root.iterdir()):
        if not muscle_dir.is_dir():
            continue
        for exercise_dir in sorted(muscle_dir.iterdir()):
            if not exercise_dir.is_dir():
                continue
            external_id = parse_external_id(exercise_dir)
            if not external_id:
                continue
            if exercise_filter and external_id != exercise_filter:
                continue
            exercise_file = exercise_dir / MEDIA_FILES["exercise"]["local_name"]
            instructions_file = exercise_dir / MEDIA_FILES["instructions"]["local_name"]
            rows.append(
                LocalExercise(
                    external_id=external_id,
                    directory=exercise_dir,
                    exercise_file=exercise_file if exercise_file.is_file() else None,
                    instructions_file=instructions_file if instructions_file.is_file() else None,
                )
            )
    return rows


class PostgresClient:
    def __init__(self, database_url: str, root_dir: str) -> None:
        self.database_url = database_url
        self.root_dir = root_dir

    @staticmethod
    def _parse_supabase_output(raw: str) -> list[dict[str, str]]:
        if not raw or not raw.strip():
            return []
        lines = [line.strip() for line in raw.splitlines() if line.strip()]
        csv_lines = [
            line
            for line in lines
            if "," in line and not line.startswith("{") and not line.lower().startswith("npm warn")
        ]
        if not csv_lines:
            return []
        reader = csv.DictReader(csv_lines)
        return [{k: (v if v is not None else "") for k, v in row.items()} for row in reader]

    def _query_rows(self, sql: str) -> list[dict[str, str]]:
        if self.database_url:
            try:
                import psycopg  # type: ignore
            except ImportError:
                psycopg = None
            if psycopg is not None:
                with psycopg.connect(self.database_url) as conn:
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

        with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as handle:
            handle.write(sql)
            sql_path = handle.name
        try:
            proc = subprocess.run(
                ["npx", "--yes", "supabase", "db", "query", "--linked", "--yes", "-o", "csv", "-f", sql_path],
                cwd=self.root_dir,
                check=False,
                capture_output=True,
                text=True,
            )
        finally:
            os.unlink(sql_path)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "supabase db query failed")
        return self._parse_supabase_output(proc.stdout)

    def fetch_exercise(self, external_id: str) -> dict[str, str] | None:
        rows = self._query_rows(
            "SELECT external_id, id::text AS id, video_path, instructions_video_path, "
            "video_status::text AS video_status, instructions_status::text AS instructions_status "
            f"FROM public.exercises WHERE external_id = '{external_id.replace(chr(39), chr(39)*2)}' LIMIT 1;"
        )
        return rows[0] if rows else None

    def fetch_exercises(self, external_ids: list[str] | None = None) -> dict[str, dict[str, str]]:
        if external_ids:
            literals = ", ".join(
                f"'{value.replace(chr(39), chr(39)*2)}'" for value in external_ids
            )
            where = f"WHERE external_id IN ({literals})"
        else:
            where = ""
        rows = self._query_rows(
            "SELECT external_id, id::text AS id, video_path, instructions_video_path, "
            f"video_status::text AS video_status, instructions_status::text AS instructions_status "
            f"FROM public.exercises {where} ORDER BY external_id;"
        )
        return {row["external_id"]: row for row in rows if row.get("external_id")}

    def update_exercise(self, external_id: str, payload: dict[str, str]) -> None:
        sets = ", ".join(f"{column} = '{value.replace(chr(39), chr(39)*2)}'" for column, value in payload.items())
        sql = (
            f"UPDATE public.exercises SET {sets} "
            f"WHERE external_id = '{external_id.replace(chr(39), chr(39)*2)}';"
        )
        self._query_rows(sql)


class StorageClient:
    """Supabase Storage REST — uses service role key only (never DATABASE_URL)."""

    def __init__(self, base_url: str, service_key: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.service_key = service_key

    def _headers(self, content_type: str | None = "application/json") -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.service_key}",
            "apikey": self.service_key,
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def _read_http_error(self, exc: urllib.error.HTTPError) -> str:
        body = exc.read().decode("utf-8", errors="replace").strip()
        if body:
            try:
                payload = json.loads(body)
                if isinstance(payload, dict):
                    message = payload.get("message") or payload.get("error") or payload.get("msg")
                    if message:
                        return f"HTTP {exc.code}: {message}"
            except json.JSONDecodeError:
                pass
            return f"HTTP {exc.code}: {body[:500]}"
        return f"HTTP {exc.code}: {exc.reason}"

    def upload(self, object_path: str, file_path: Path, content_hash: str) -> None:
        url = f"{self.base_url}/storage/v1/object/{BUCKET}/{urllib.parse.quote(object_path, safe='/')}"
        body = file_path.read_bytes()
        headers = self._headers(content_type=mimetypes.guess_type(str(file_path))[0] or "video/mp4")
        headers["x-upsert"] = "true"
        headers["cache-control"] = "3600"
        headers["x-metadata-content-hash"] = content_hash
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, context=SSL_CONTEXT) as resp:
                raw = resp.read().decode("utf-8", errors="replace").strip()
                if resp.status not in {200, 201}:
                    raise RuntimeError(f"upload {object_path} unexpected status {resp.status}: {raw[:300]}")
        except urllib.error.HTTPError as exc:
            raise RuntimeError(f"upload {object_path} failed: {self._read_http_error(exc)}") from exc

    def list_objects(self, prefix: str) -> list[str]:
        url = f"{self.base_url}/storage/v1/object/list/{BUCKET}"
        payload = json.dumps({"prefix": prefix, "limit": 100, "offset": 0}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers=self._headers(), method="POST")
        try:
            with urllib.request.urlopen(req, context=SSL_CONTEXT) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raise RuntimeError(f"list {prefix} failed: {self._read_http_error(exc)}") from exc

        if not isinstance(data, list):
            raise RuntimeError(f"list {prefix} returned unexpected payload type: {type(data).__name__}")

        names: list[str] = []
        for item in data:
            if isinstance(item, dict):
                name = str(item.get("name", "")).strip()
                if name:
                    names.append(name)
        return names

    def object_exists(self, object_path: str) -> bool:
        prefix, _, filename = object_path.rpartition("/")
        listed = self.list_objects(prefix)
        return filename in listed

    def verify_objects_exist(self, object_paths: list[str]) -> None:
        missing = [path for path in object_paths if not self.object_exists(path)]
        if missing:
            raise RuntimeError(f"storage verification failed; missing objects: {', '.join(missing)}")

    def create_signed_url(self, object_path: str, expires_in: int = 3600) -> str:
        url = f"{self.base_url}/storage/v1/object/sign/{BUCKET}/{urllib.parse.quote(object_path, safe='/')}"
        payload = json.dumps({"expiresIn": expires_in}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers=self._headers(), method="POST")
        try:
            with urllib.request.urlopen(req, context=SSL_CONTEXT) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raise RuntimeError(f"signed URL for {object_path} failed: {self._read_http_error(exc)}") from exc

        signed = data.get("signedURL") or data.get("signedUrl")
        if not signed:
            raise RuntimeError(f"signed URL for {object_path} returned no URL")
        if signed.startswith("/"):
            signed = f"{self.base_url}/storage/v1{signed}"
        return signed


def remote_object_path(external_id: str, remote_name: str) -> str:
    return f"exercises/{external_id}/{remote_name}"


def desired_db_values(object_path: str) -> tuple[str, str]:
    return object_path, "ready"


def verify_db_paths(db: PostgresClient, external_id: str, expected_paths: dict[str, str]) -> None:
    row = db.fetch_exercise(external_id)
    if not row:
        raise RuntimeError(f"DB verification failed: exercise {external_id} not found after update")
    for column, expected in expected_paths.items():
        actual = (row.get(column) or "").strip()
        if not actual:
            raise RuntimeError(f"DB verification failed: {column} is NULL for {external_id}")
        if actual != expected:
            raise RuntimeError(
                f"DB verification failed: {column}={actual!r} expected {expected!r} for {external_id}"
            )


def verify_signed_url_fetchable(signed_url: str) -> None:
    req = urllib.request.Request(signed_url, method="HEAD")
    try:
        with urllib.request.urlopen(req, context=SSL_CONTEXT) as resp:
            if resp.status not in {200, 206}:
                raise RuntimeError(f"signed URL HEAD returned status {resp.status}")
    except urllib.error.HTTPError as exc:
        if exc.code in {200, 206}:
            return
        body = exc.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"signed URL not fetchable: HTTP {exc.code} {body}") from exc


def sync_one_exercise(
    item: LocalExercise,
    db_row: dict[str, str],
    storage: StorageClient | None,
    db: PostgresClient,
    *,
    dry_run: bool,
    verify_mode: bool,
) -> tuple[int, int, int]:
    """Returns (uploaded, would_upload, updated). Raises on verify failure."""

    uploaded = 0
    would_upload = 0
    upload_actions: list[tuple[str, Path, str]] = []
    db_updates: dict[str, str] = {}
    uploaded_paths: list[str] = []

    for kind, spec in MEDIA_FILES.items():
        local_path = item.exercise_file if kind == "exercise" else item.instructions_file
        if local_path is None:
            if verify_mode:
                raise RuntimeError(f"local file missing for {item.external_id}: {spec['local_name']}")
            continue

        object_path = remote_object_path(item.external_id, spec["remote_name"])
        local_hash = sha256_file(local_path)
        desired_path, desired_status = desired_db_values(object_path)

        current_path = db_row.get(spec["path_column"]) or ""
        current_status = db_row.get(spec["status_column"]) or ""

        needs_upload = True
        if not dry_run and storage is not None and storage.object_exists(object_path):
            # Skip re-upload when object already present (hash not stored in API metadata reliably)
            needs_upload = False

        needs_db_update = current_path != desired_path or current_status != desired_status

        if needs_upload:
            upload_actions.append((object_path, local_path, local_hash))
        if needs_db_update:
            db_updates[spec["path_column"]] = desired_path
            db_updates[spec["status_column"]] = desired_status

    if not upload_actions and not db_updates:
        print(f"SKIP {item.external_id}")
        return 0, 0, 0

    for object_path, local_path, local_hash in upload_actions:
        if dry_run:
            print(f"WOULD_UPLOAD {object_path} ({local_hash[:12]}…)")
            would_upload += 1
        else:
            if storage is None:
                raise RuntimeError("Storage client unavailable")
            print(f"UPLOAD {object_path} …")
            storage.upload(object_path, local_path, local_hash)
            uploaded += 1
            uploaded_paths.append(object_path)

    if not dry_run and uploaded_paths:
        storage.verify_objects_exist(uploaded_paths)
        print(f"VERIFY storage OK: {', '.join(uploaded_paths)}")

    updated = 0
    if db_updates:
        if dry_run:
            print(f"WOULD_UPDATE DB {item.external_id} {json.dumps(db_updates, ensure_ascii=False)}")
        else:
            db.update_exercise(item.external_id, db_updates)
            expected_paths = {
                "video_path": remote_object_path(item.external_id, MEDIA_FILES["exercise"]["remote_name"]),
                "instructions_video_path": remote_object_path(
                    item.external_id, MEDIA_FILES["instructions"]["remote_name"]
                ),
            }
            verify_db_paths(db, item.external_id, expected_paths)
            row = db.fetch_exercise(item.external_id)
            print(
                f"VERIFY db OK {item.external_id} "
                f"video_path={row.get('video_path')} "
                f"instructions_video_path={row.get('instructions_video_path')}"
            )
            updated = 1

    if verify_mode and not dry_run and storage is not None:
        exercise_path = remote_object_path(item.external_id, MEDIA_FILES["exercise"]["remote_name"])
        signed = storage.create_signed_url(exercise_path)
        verify_signed_url_fetchable(signed)
        print(f"VERIFY signed URL OK for {exercise_path}")

    return uploaded, would_upload, updated


def sync_videos(library_root: Path, dry_run: bool, exercise_filter: str) -> int:
    counters = Counters()
    local_rows = discover_local_exercises(library_root, exercise_filter)
    verify_mode = bool(exercise_filter) and not dry_run

    print(f"Discovered {len(local_rows)} local exercise folder(s)")
    if exercise_filter and not local_rows:
        print(f"ERROR no local folder found for external_id={exercise_filter}", file=sys.stderr)
        return 1

    database_url = os.environ.get("DATABASE_URL", "")
    root_dir = os.environ.get("ROOT_DIR", ".")
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or ""
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    db = PostgresClient(database_url, root_dir)
    external_ids = [row.external_id for row in local_rows]

    try:
        exercises = db.fetch_exercises(external_ids or None)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR database: {exc}", file=sys.stderr)
        return 1

    print(f"Loaded {len(exercises)} matching exercise(s) from database")

    storage = None
    if not dry_run:
        storage = StorageClient(supabase_url, service_key)

    for item in local_rows:
        try:
            db_row = exercises.get(item.external_id)
            if not db_row:
                raise RuntimeError(f"exercise not found in database for external_id={item.external_id}")

            up, would, upd = sync_one_exercise(
                item,
                db_row,
                storage,
                db,
                dry_run=dry_run,
                verify_mode=verify_mode,
            )
            counters.uploaded += up
            counters.would_upload += would
            counters.updated += upd
            if up == 0 and would == 0 and upd == 0:
                counters.skipped += 1

        except Exception as exc:  # noqa: BLE001
            counters.errors += 1
            print(f"ERROR {item.external_id}: {exc}", file=sys.stderr)
            if verify_mode:
                print("ABORT single-exercise sync due to verification failure", file=sys.stderr)
                break

    print("---")
    if dry_run:
        print(f"would_upload={counters.would_upload}")
    else:
        print(f"uploaded={counters.uploaded}")
    print(f"updated={counters.updated}")
    print(f"skipped={counters.skipped}")
    print(f"errors={counters.errors}")
    return 1 if counters.errors else 0


def main() -> int:
    if len(sys.argv) not in {3, 4}:
        print("usage: python <library_root> <dry_run:0|1> [exercise_filter]", file=sys.stderr)
        return 2
    library_root = Path(sys.argv[1])
    dry_run = sys.argv[2] == "1"
    exercise_filter = sys.argv[3] if len(sys.argv) == 4 else ""
    os.environ.setdefault("ROOT_DIR", str(Path.cwd()))
    return sync_videos(library_root, dry_run, exercise_filter)


if __name__ == "__main__":
    raise SystemExit(main())
PY

export ROOT_DIR DATABASE_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY
python3 -c "$PYTHON_SYNC" "$LIBRARY_ROOT" "$DRY_RUN" "$EXERCISE_FILTER"
exit_code=$?

log "Done."
exit "$exit_code"
