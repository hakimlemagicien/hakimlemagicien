#!/usr/bin/env bash
# sync-exercises.sh
#
# Sync exercises from scripts/exercise-library.json into Supabase public.exercises.
#
# Schema (migration 20260710170000):
#   - external_id  = JSON id (e.g. CH-001) — lookup key, not a "code" column
#   - name_en / name_ar = locales (en + ar); no exercise_translations table
#
# Safe:
#   - Never deletes rows
#   - Never uploads or modifies video/storage fields
#   - Upserts only: create missing exercises, update existing ones
#
# Usage:
#   ./scripts/sync-exercises.sh
#   ./scripts/sync-exercises.sh --dry-run
#   ./scripts/sync-exercises.sh --json /path/to/exercise-library.json
#
# Environment (auto-loaded from .env / .env.local):
#   DATABASE_URL / SUPABASE_DB_URL     Direct Postgres (preferred without service role)
#   SUPABASE_DB_PASSWORD               Builds DATABASE_URL with linked pooler host
#   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY   Supabase REST (optional)
#   Supabase CLI linked project        Fallback when no URL/key in env files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_JSON="${SCRIPT_DIR}/exercise-library.json"

JSON_PATH="${DEFAULT_JSON}"
DRY_RUN=0
SYNC_BACKEND=""

usage() {
  cat <<'EOF'
Usage: sync-exercises.sh [options]

Options:
  --json PATH     Path to exercise-library.json (default: scripts/exercise-library.json)
  --dry-run       Resolve changes without writing to the database
  -h, --help      Show this help

Environment (loaded from .env then .env.local):
  DATABASE_URL / SUPABASE_DB_URL     Direct Postgres via psql (recommended)
  SUPABASE_DB_PASSWORD / DB_PASSWORD Builds DATABASE_URL when pooler host is known
  SUPABASE_URL                       Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY          Optional — enables REST instead of psql
  SUPABASE_PROJECT_ID                Used with SUPABASE_DB_PASSWORD

If no DATABASE_URL or service role key is set, uses the Supabase CLI linked
project (supabase link) via: npx supabase db query --linked

Report:
  created / updated / skipped / errors
EOF
}

log() {
  printf '[sync-exercises] %s\n' "$*"
}

die() {
  printf '[sync-exercises] ERROR: %s\n' "$*" >&2
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

has_psycopg() {
  python3 -c "import psycopg" >/dev/null 2>&1
}

resolve_sync_backend() {
  : "${SUPABASE_URL:=${VITE_SUPABASE_URL:-}}"
  : "${SUPABASE_PROJECT_ID:=${VITE_SUPABASE_PROJECT_ID:-}}"
  : "${SUPABASE_SERVICE_ROLE_KEY:=${SUPABASE_SECRET_KEY:-}}"

  resolve_database_url

  if [[ -n "${DATABASE_URL:-}" ]]; then
    if command -v psql >/dev/null 2>&1 || has_psycopg; then
      SYNC_BACKEND="postgres"
    else
      SYNC_BACKEND="supabase-db-url"
    fi
    export DATABASE_URL
    return 0
  fi

  if [[ -n "${SUPABASE_URL:-}" && -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    SYNC_BACKEND="rest"
    return 0
  fi

  if [[ -f "${ROOT_DIR}/supabase/.temp/project-ref" || -f "${ROOT_DIR}/supabase/.temp/linked-project.json" ]]; then
    SYNC_BACKEND="supabase-linked"
    return 0
  fi

  die "No database credentials found. Add SUPABASE_DB_PASSWORD or DATABASE_URL to .env.local (see .env.local.example)."
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

load_env_file "${ROOT_DIR}/.env"
load_env_file "${ROOT_DIR}/.env.local"

command -v python3 >/dev/null 2>&1 || die "python3 is required but not found in PATH"

resolve_sync_backend

export ROOT_DIR SYNC_BACKEND DATABASE_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY

log "JSON:     ${JSON_PATH}"
log "Dry-run:  $([[ "$DRY_RUN" -eq 1 ]] && echo yes || echo no)"
case "$SYNC_BACKEND" in
  postgres) log "Backend:  Postgres (DATABASE_URL via psql/psycopg)" ;;
  supabase-db-url) log "Backend:  Supabase CLI (--db-url, csv)" ;;
  rest) log "Backend:  Supabase REST" ;;
  supabase-linked) log "Backend:  Supabase CLI (--linked, csv)" ;;
esac

read -r -d '' PYTHON_SYNC <<'PY' || true
import csv
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any

MUSCLE_CODE_MAP = {
    "abs": "abs",
    "back": "back",
    "biceps": "biceps",
    "calves": "calves",
    "cardio": "cardio",
    "chest": "chest",
    "forearms": "forearms",
    "glutes": "glutes",
    "legs": "legs",
    "mobility": "mobility",
    "shoulders": "shoulders",
    "triceps": "triceps",
    "warm up": "warm_up",
    "warm_up": "warm_up",
}

DIFFICULTY_VALUES = {"beginner", "intermediate", "advanced"}
MEDIA_STATUS_VALUES = {"placeholder", "ready", "missing"}

# Fields synced from JSON. Video/storage columns are intentionally excluded.
SYNC_FIELDS = (
    "slug",
    "muscle_group_id",
    "name_en",
    "name_ar",
    "equipment",
    "difficulty",
    "primary_muscle",
    "video_status",
    "sort_order",
)


@dataclass
class Counters:
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: int = 0


def slugify(name: str) -> str:
    slug = name.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug or "exercise"


def muscle_to_code(muscle: str) -> str:
    normalized = muscle.strip().lower().replace("_", " ")
    normalized = re.sub(r"\s+", " ", normalized)
    if normalized in MUSCLE_CODE_MAP:
        return MUSCLE_CODE_MAP[normalized]
    slug = re.sub(r"[^a-z0-9]+", "_", normalized).strip("_")
    return slug or "other"


def parse_sort_order(external_id: str) -> int:
    suffix = external_id.rsplit("-", 1)[-1]
    return int(suffix) if suffix.isdigit() else 0


def normalize_difficulty(level: Any) -> str | None:
    if level is None:
        return None
    value = str(level).strip().lower()
    if not value:
        return None
    return value if value in DIFFICULTY_VALUES else None


def normalize_media_status(status: Any) -> str:
    value = str(status or "placeholder").strip().lower()
    return value if value in MEDIA_STATUS_VALUES else "placeholder"


def load_exercises(json_path: str) -> list[dict[str, Any]]:
    with open(json_path, encoding="utf-8") as fh:
        data = json.load(fh)

    if not isinstance(data, dict):
        raise ValueError("JSON root must be an object mapping muscle groups to exercise arrays")

    rows: list[dict[str, Any]] = []
    for muscle, items in data.items():
        if not isinstance(muscle, str) or not muscle.strip():
            raise ValueError("Muscle group names must be non-empty strings")
        if not isinstance(items, list) or not items:
            raise ValueError(f"Muscle group '{muscle}' must be a non-empty array")

        muscle_code = muscle_to_code(muscle)
        for item in items:
            if not isinstance(item, dict):
                raise ValueError(f"Each exercise under '{muscle}' must be an object")

            external_id = str(item.get("id", "")).strip()
            name_en = str(item.get("name", "")).strip()
            name_ar = str(item.get("name_ar") or name_en).strip()

            if not external_id or not name_en:
                raise ValueError(
                    f"Exercise under '{muscle}' requires non-empty 'id' and 'name'"
                )

            rows.append(
                {
                    "external_id": external_id,
                    "slug": slugify(name_en),
                    "muscle_code": muscle_code,
                    "muscle_label": muscle.strip(),
                    "name_en": name_en,
                    "name_ar": name_ar,
                    "equipment": str(item.get("equipment") or "").strip() or None,
                    "difficulty": normalize_difficulty(item.get("level")),
                    "video_status": normalize_media_status(item.get("status")),
                    "sort_order": parse_sort_order(external_id),
                }
            )

    return rows


class RestClient:
    def __init__(self, base_url: str, service_key: str, dry_run: bool) -> None:
        self.base_url = base_url.rstrip("/")
        self.service_key = service_key
        self.dry_run = dry_run
        self.muscle_groups: dict[str, str] = {}

    def _request(
        self,
        method: str,
        table: str,
        *,
        query: dict[str, str] | None = None,
        payload: Any = None,
        prefer: str | None = None,
    ) -> tuple[int, Any]:
        params = urllib.parse.urlencode(query or {})
        url = f"{self.base_url}/rest/v1/{table}"
        if params:
            url = f"{url}?{params}"

        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer

        body = None
        if payload is not None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")

        if self.dry_run and method in {"POST", "PATCH", "PUT"}:
            if method == "POST" and table == "exercises":
                return 200, [{"id": "00000000-0000-0000-0000-000000000000"}]
            return 200, None

        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode("utf-8")
                if not raw:
                    return resp.status, None
                return resp.status, json.loads(raw)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"{method} {table} failed ({exc.code}): {detail}") from exc

    def load_muscle_groups(self) -> None:
        _, rows = self._request(
            "GET",
            "exercise_muscle_groups",
            query={"select": "id,code"},
        )
        self.muscle_groups = {
            str(row["code"]): str(row["id"])
            for row in (rows or [])
            if row.get("code") and row.get("id")
        }

    def get_exercise(self, external_id: str) -> dict[str, Any] | None:
        _, rows = self._request(
            "GET",
            "exercises",
            query={
                "select": ",".join(["id", "external_id", *SYNC_FIELDS]),
                "external_id": f"eq.{external_id}",
                "limit": "1",
            },
        )
        if not rows:
            return None
        return rows[0]

    def insert_exercise(self, payload: dict[str, Any]) -> dict[str, Any]:
        _, rows = self._request(
            "POST",
            "exercises",
            payload=payload,
            prefer="return=representation",
        )
        if not rows:
            raise RuntimeError("insert exercise returned no rows")
        return rows[0]

    def update_exercise(self, exercise_id: str, payload: dict[str, Any]) -> None:
        self._request(
            "PATCH",
            "exercises",
            query={"id": f"eq.{exercise_id}"},
            payload=payload,
            prefer="return=minimal",
        )


class PostgresClient:
    def __init__(
        self,
        *,
        dry_run: bool,
        database_url: str = "",
        root_dir: str = ".",
        mode: str = "postgres",
    ) -> None:
        self.dry_run = dry_run
        self.database_url = database_url
        self.root_dir = root_dir
        self.mode = mode
        self.muscle_groups: dict[str, str] = {}
        self._psycopg = None
        self._conn = None

    @staticmethod
    def _literal(value: str | None) -> str:
        if value is None:
            return "NULL"
        return "'" + value.replace("'", "''") + "'"

    @staticmethod
    def _extract_supabase_json(raw: str) -> dict[str, Any] | None:
        text = raw or ""
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end <= start:
            return None
        try:
            payload = json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None
        return payload if isinstance(payload, dict) else None

    @staticmethod
    def _parse_supabase_output(raw: str) -> list[dict[str, str]]:
        if not raw or not raw.strip():
            return []

        lines = [line.strip() for line in raw.splitlines() if line.strip()]
        csv_lines: list[str] = []
        for line in lines:
            lowered = line.lower()
            if lowered.startswith("npm warn"):
                continue
            if lowered.startswith("initialising login role"):
                continue
            if line.startswith("{") and line.endswith("}"):
                continue
            csv_lines.append(line)

        if csv_lines:
            header_index = next(
                (index for index, line in enumerate(csv_lines) if "," in line),
                None,
            )
            if header_index is not None:
                reader = csv.DictReader(csv_lines[header_index:])
                parsed = [
                    {key: (value if value is not None else "") for key, value in row.items()}
                    for row in reader
                ]
                if parsed:
                    return parsed

        payload = PostgresClient._extract_supabase_json(raw)
        if not payload:
            return []

        rows = payload.get("rows")
        if not isinstance(rows, list) or not rows:
            return []

        if len(rows) == 1 and isinstance(rows[0], dict) and "data" in rows[0]:
            data = rows[0]["data"]
            if isinstance(data, dict):
                if data and all(not isinstance(value, (dict, list)) for value in data.values()):
                    return [
                        {"code": str(key), "id": str(value)}
                        for key, value in data.items()
                    ]
            if isinstance(data, str) and data:
                try:
                    decoded = json.loads(data)
                except json.JSONDecodeError:
                    decoded = None
                if isinstance(decoded, dict):
                    return [
                        {"code": str(key), "id": str(value)}
                        for key, value in decoded.items()
                    ]

        parsed_rows: list[dict[str, str]] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            if len(row) == 1:
                value = next(iter(row.values()))
                if isinstance(value, dict):
                    parsed_rows.append(
                        {str(key): str(val) if val is not None else "" for key, val in value.items()}
                    )
                    continue
            parsed_rows.append(
                {str(key): str(val) if val is not None else "" for key, val in row.items()}
            )
        return parsed_rows

    @staticmethod
    def _parse_csv(raw: str) -> list[dict[str, str]]:
        return PostgresClient._parse_supabase_output(raw)

    def _ensure_psycopg(self) -> None:
        if self._psycopg is not None:
            return
        try:
            import psycopg  # type: ignore
        except ImportError as exc:
            raise RuntimeError(
                "psycopg is required for DATABASE_URL access. Install with: pip3 install 'psycopg[binary]'"
            ) from exc
        self._psycopg = psycopg

    def _connect(self) -> Any:
        self._ensure_psycopg()
        if self._conn is None:
            self._conn = self._psycopg.connect(self.database_url)
        return self._conn

    def _query_rows_direct(self, sql: str) -> list[dict[str, str]]:
        if self.mode == "postgres" and self.database_url:
            if self._has_psql():
                return self._query_rows_psql(sql)
            conn = self._connect()
            with conn.cursor() as cur:
                cur.execute(sql)
                if cur.description is None:
                    conn.commit()
                    return []
                columns = [desc.name for desc in cur.description]
                rows = cur.fetchall()
                conn.commit()
                return [
                    {col: ("" if val is None else str(val)) for col, val in zip(columns, row)}
                    for row in rows
                ]

        return self._query_rows_supabase_cli(sql)

    def _has_psql(self) -> bool:
        return subprocess.run(
            ["psql", "--version"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        ).returncode == 0

    def _query_rows_psql(self, sql: str) -> list[dict[str, str]]:
        proc = subprocess.run(
            ["psql", self.database_url, "-v", "ON_ERROR_STOP=1", "--csv", "-c", sql],
            check=False,
            capture_output=True,
            text=True,
        )
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "psql failed")
        return self._parse_csv(proc.stdout)

    def _query_rows_supabase_cli(self, sql: str) -> list[dict[str, str]]:
        with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as handle:
            handle.write(sql)
            sql_path = handle.name

        cmd = ["npx", "--yes", "supabase", "db", "query", "--yes", "-o", "csv", "-f", sql_path]
        if self.mode == "supabase-db-url" and self.database_url:
            cmd.extend(["--db-url", self.database_url])
        else:
            cmd.append("--linked")

        try:
            proc = subprocess.run(
                cmd,
                cwd=self.root_dir,
                check=False,
                capture_output=True,
                text=True,
            )
        finally:
            os.unlink(sql_path)

        if proc.returncode != 0:
            detail = (proc.stderr or proc.stdout or "supabase db query failed").strip()
            raise RuntimeError(detail)

        rows = self._parse_supabase_output(proc.stdout)
        if not rows:
            rows = self._parse_supabase_output((proc.stdout or "") + "\n" + (proc.stderr or ""))
        if not rows and "permission denied" in ((proc.stderr or "") + (proc.stdout or "")).lower():
            raise RuntimeError(proc.stderr.strip() or proc.stdout.strip())
        return rows

    def _execute(self, sql: str) -> None:
        if self.dry_run and re.match(r"^\s*(INSERT|UPDATE|DELETE)\b", sql, re.IGNORECASE):
            return
        self._query_rows_direct(sql)

    def load_muscle_groups(self) -> None:
        rows = self._query_rows_direct(
            "SELECT code, id::text AS id FROM public.exercise_muscle_groups ORDER BY sort_order;"
        )
        self.muscle_groups = {
            str(row["code"]): str(row["id"])
            for row in rows
            if row.get("code") and row.get("id")
        }

    def get_exercise(self, external_id: str) -> dict[str, Any] | None:
        rows = self._query_rows_direct(
            "SELECT id::text AS id, external_id, slug, muscle_group_id::text AS muscle_group_id, "
            "name_en, name_ar, equipment, difficulty::text AS difficulty, primary_muscle, "
            "video_status::text AS video_status, sort_order::text AS sort_order "
            f"FROM public.exercises WHERE external_id = {self._literal(external_id)} LIMIT 1;"
        )
        if not rows:
            return None
        row = rows[0]
        row["sort_order"] = int(row.get("sort_order") or 0)
        if row.get("equipment") == "":
            row["equipment"] = None
        if row.get("difficulty") == "":
            row["difficulty"] = None
        return row

    def insert_exercise(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.dry_run:
            return {"id": "00000000-0000-0000-0000-000000000000"}

        rows = self._query_rows_direct(
            "INSERT INTO public.exercises ("
            "external_id, slug, muscle_group_id, name_en, name_ar, equipment, "
            "difficulty, primary_muscle, video_status, sort_order"
            ") VALUES ("
            f"{self._literal(payload['external_id'])}, "
            f"{self._literal(payload['slug'])}, "
            f"{self._literal(payload['muscle_group_id'])}::uuid, "
            f"{self._literal(payload['name_en'])}, "
            f"{self._literal(payload['name_ar'])}, "
            f"{self._literal(payload.get('equipment'))}, "
            f"NULLIF({self._literal(payload.get('difficulty') or '')}, '')::public.exercise_difficulty, "
            f"{self._literal(payload['primary_muscle'])}, "
            f"{self._literal(payload['video_status'])}::public.exercise_media_status, "
            f"{int(payload['sort_order'])}"
            ") RETURNING id::text AS id;"
        )
        if not rows:
            raise RuntimeError("insert exercise returned no rows")
        return rows[0]

    def update_exercise(self, exercise_id: str, payload: dict[str, Any]) -> None:
        self._execute(
            "UPDATE public.exercises SET "
            f"slug = {self._literal(payload['slug'])}, "
            f"muscle_group_id = {self._literal(payload['muscle_group_id'])}::uuid, "
            f"name_en = {self._literal(payload['name_en'])}, "
            f"name_ar = {self._literal(payload['name_ar'])}, "
            f"equipment = {self._literal(payload.get('equipment'))}, "
            f"difficulty = NULLIF({self._literal(payload.get('difficulty') or '')}, '')::public.exercise_difficulty, "
            f"primary_muscle = {self._literal(payload['primary_muscle'])}, "
            f"video_status = {self._literal(payload['video_status'])}::public.exercise_media_status, "
            f"sort_order = {int(payload['sort_order'])} "
            f"WHERE id = {self._literal(exercise_id)}::uuid;"
        )


def build_payload(row: dict[str, Any], muscle_group_id: str) -> dict[str, Any]:
    return {
        "external_id": row["external_id"],
        "slug": row["slug"],
        "muscle_group_id": muscle_group_id,
        "name_en": row["name_en"],
        "name_ar": row["name_ar"],
        "equipment": row["equipment"],
        "difficulty": row["difficulty"],
        "primary_muscle": row["muscle_label"],
        "video_status": row["video_status"],
        "sort_order": row["sort_order"],
    }


def exercise_changed(existing: dict[str, Any], payload: dict[str, Any]) -> bool:
    for field in SYNC_FIELDS:
        left = existing.get(field)
        right = payload.get(field)
        if field == "sort_order":
            if int(left or 0) != int(right or 0):
                return True
            continue
        if (left or None) != (right or None):
            return True
    return False


def sync_one(client: Any, row: dict[str, Any], counters: Counters) -> None:
    muscle_group_id = client.muscle_groups.get(row["muscle_code"])
    if not muscle_group_id:
        raise RuntimeError(
            f"muscle group code '{row['muscle_code']}' not found in exercise_muscle_groups"
        )

    payload = build_payload(row, muscle_group_id)
    existing = client.get_exercise(row["external_id"])

    if existing is None:
        client.insert_exercise(payload)
        counters.created += 1
        print(f"CREATE {row['external_id']} ({row['name_en']})")
        return

    if not exercise_changed(existing, payload):
        counters.skipped += 1
        print(f"SKIP {row['external_id']} (no changes)")
        return

    client.update_exercise(str(existing["id"]), payload)
    counters.updated += 1
    print(f"UPDATE {row['external_id']} ({row['name_en']})")


def make_client(dry_run: bool) -> Any:
    backend = os.environ.get("SYNC_BACKEND", "")
    database_url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    root_dir = os.environ.get("ROOT_DIR", ".")

    if backend in {"postgres", "supabase-db-url"} and database_url:
        return PostgresClient(
            dry_run=dry_run,
            database_url=database_url,
            root_dir=root_dir,
            mode=backend,
        )
    if backend == "supabase-linked":
        return PostgresClient(dry_run=dry_run, root_dir=root_dir, mode="supabase-linked")
    if backend == "rest" and supabase_url and service_key:
        return RestClient(supabase_url, service_key, dry_run)
    if database_url:
        return PostgresClient(
            dry_run=dry_run,
            database_url=database_url,
            root_dir=root_dir,
            mode="postgres",
        )
    if supabase_url and service_key:
        return RestClient(supabase_url, service_key, dry_run)

    raise RuntimeError(
        "No database backend configured. Set SUPABASE_DB_PASSWORD or DATABASE_URL in .env.local."
    )


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: python <json_path> <dry_run:0|1>", file=sys.stderr)
        return 2

    json_path = sys.argv[1]
    dry_run = sys.argv[2] == "1"
    counters = Counters()

    try:
        rows = load_exercises(json_path)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR invalid JSON: {exc}", file=sys.stderr)
        return 1

    try:
        client = make_client(dry_run)
        client.load_muscle_groups()
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR database connection: {exc}", file=sys.stderr)
        return 1

    if not client.muscle_groups:
        print("ERROR no muscle groups found in exercise_muscle_groups", file=sys.stderr)
        return 1

    print(f"Loaded {len(rows)} exercises from JSON")
    print(f"Loaded {len(client.muscle_groups)} muscle groups from database")

    for row in rows:
        try:
            sync_one(client, row, counters)
        except Exception as exc:  # noqa: BLE001
            counters.errors += 1
            print(f"ERROR {row['external_id']}: {exc}", file=sys.stderr)

    print("---")
    print(f"created={counters.created}")
    print(f"updated={counters.updated}")
    print(f"skipped={counters.skipped}")
    print(f"errors={counters.errors}")
    return 1 if counters.errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
PY

python3 -c "$PYTHON_SYNC" "$JSON_PATH" "$DRY_RUN"
exit_code=$?

log "Done."
exit "$exit_code"
