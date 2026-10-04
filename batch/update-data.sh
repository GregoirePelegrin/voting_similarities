#!/usr/bin/env bash
set -euo pipefail

# Daily vote-data update pipeline (run on the VPS by .github/workflows/update-data.yml)
#   git -> llm-preflight -> crawl -> parse -> recategorize -> (on changes or drift) ingest + recompute -> restart
# Telegram notifications (success every run, failure on error) use TELEGRAM_BOT_KEY /
# TELEGRAM_CHAT_ID injected by the workflow; LLM_API_KEY also injected (Groq).

DEPLOY_DIR="${DEPLOY_DIR:-/app/voting_similarities}"
ENV_FILE="$DEPLOY_DIR/batch/.env.data"
LOG_DIR="$DEPLOY_DIR/batch/logs"
LOCKFILE="/tmp/votes-update.lock"

CONTAINER="voting-backend"
PG_CONTAINER="parliament_analysis_postgres"
SOURCE="fr_assemblee_nationale"
DB_ENV="DB_$(printf '%s' "$SOURCE" | tr '[:lower:]' '[:upper:]')_NAME"

mkdir -p "$LOG_DIR"

# --- Lock: never run two updates at once --------------------------------------
exec 9>"$LOCKFILE"
if ! flock -n 9; then
  echo "Another update is already running; skipping."
  exit 0
fi

# --- Telegram -----------------------------------------------------------------
tg() {
  local text="$1"
  local bot_key="${TELEGRAM_BOT_KEY:-}"
  local chat_id="${TELEGRAM_CHAT_ID:-}"
  if [ -z "$bot_key" ] || [ -z "$chat_id" ]; then
    echo "Telegram not configured; message skipped"
    return 0
  fi
  curl -s -o /dev/null -X POST \
    "https://api.telegram.org/bot${bot_key}/sendMessage" \
    --data-urlencode "chat_id=${chat_id}" \
    --data-urlencode "text=${text}" || true
}

# --- Environment --------------------------------------------------------------
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "WARNING: $ENV_FILE not found; relying on injected/default values"
fi

DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-}"
MAIN_DB="$(printenv "$DB_ENV" || true)"
MAIN_DB="${MAIN_DB:-fr_assemblee_nationale}"
LLM_BASE_URL="${LLM_BASE_URL:-https://api.groq.com/openai/v1}"
LLM_MODEL_BIG="${LLM_MODEL_BIG:-qwen/qwen3.8-27b}"
LLM_API_KEY="${LLM_API_KEY:-}"
BACKEND_DB="${BACKEND_DB:-voting_similarities}"
if [ -z "${DB_PASSWORD:-}" ]; then
  echo "WARNING: DB_PASSWORD is empty (is batch/.env.data present?); connections may fail if postgres requires auth"
fi
DB_PASSWORD_URL="$(printf '%s' "${DB_PASSWORD}" | python3 -c 'import sys,urllib.parse; sys.stdout.write(urllib.parse.quote(sys.stdin.read(), safe=""))' 2>/dev/null || printf '%s' "${DB_PASSWORD}")"
PARLIAMENT_DB_URL="${PARLIAMENT_DB_URL:-postgresql+asyncpg://${DB_USER}:${DB_PASSWORD_URL}@${DB_HOST}:${DB_PORT}/${MAIN_DB}}"
RUN_URL="${RUN_URL:-}"

# --- Step helpers (log + failure notification) --------------------------------
CURRENT_STEP="setup"
STEP_OUT="$LOG_DIR/step-setup.log"

mem_summary() {
  free -m 2>/dev/null | awk 'NR==2{printf "used=%dMB avail=%dMB", $3, $7}' || echo "mem n/a"
}

begin_step() {
  CURRENT_STEP="$1"
  STEP_OUT="$LOG_DIR/step-${CURRENT_STEP//\//_}.log"
  : > "$STEP_OUT"
  echo ">> Step: ${CURRENT_STEP} | $(date '+%H:%M:%S') | $(mem_summary)"
}

on_error() {
  local code=$?
  local tail_lines
  tail_lines="$(tail -n 15 "$STEP_OUT" 2>/dev/null || true)"
  tg "🗳️ [voting_similarities] ❌ ÉCHEC — étape: ${CURRENT_STEP}
${tail_lines}
mem: $(mem_summary)
run: ${RUN_URL}"
  exit "$code"
}
trap 'on_error' ERR

psql_count() {
  podman exec "$PG_CONTAINER" psql -U postgres -d "$MAIN_DB" -t -A -c "$1" \
    | tr -d ' '
}

# Extractor env: DB_* + LLM_* for the vendored package inside the backend container
EXTRACTOR_ENV=( \
  -e "DB_${DB_ENV#DB_}=$MAIN_DB" \
  -e "DB_USER=$DB_USER" \
  -e "DB_PASSWORD=$DB_PASSWORD" \
  -e "DB_HOST=$DB_HOST" \
  -e "DB_PORT=$DB_PORT" \
  -e "LLM_API_KEY=$LLM_API_KEY" \
  -e "LLM_BASE_URL=$LLM_BASE_URL" \
  -e "LLM_MODEL_BIG=$LLM_MODEL_BIG" \
  -e "LLM_MODEL_SMALL=${LLM_MODEL_SMALL:-llama-3.1-8b-instant}" \
  -e "LLM_MAX_TOKENS=${LLM_MAX_TOKENS:-200}" \
  -e "LLM_TEMPERATURE=${LLM_TEMPERATURE:-0.7}" \
  -e "LLM_TIMEOUT=${LLM_TIMEOUT:-60}" \
  -e "LLM_MAX_RETRIES=${LLM_MAX_RETRIES:-3}" \
)

# Run extractor steps in a *transient*, memory-capped container (never inside the
# live backend container) so a peak can't OOM-kill the API. Logs go to stdout and
# are appended to the current step log for the failure Telegram.
run_extractor() {
  podman run --rm --network host --memory=2048m \
    "${EXTRACTOR_ENV[@]}" \
    voting-backend:latest \
    python3 -m "parliament_data_extractor.scripts.$1" "${@:2}" \
    2>&1 | tee -a "$STEP_OUT"
}

# --- 0. Update code -----------------------------------------------------------
begin_step "git"
git config --global --add safe.directory "$DEPLOY_DIR" >/dev/null 2>&1 || true
cd "$DEPLOY_DIR"
git fetch origin >/dev/null
git checkout main
git pull --ff-only

# --- 1. LLM preflight ---------------------------------------------------------
# Categories are the backbone of the whole similarity computation. If the LLM
# key is missing/expired, parse() silently stores votes with empty categories
# (see process_raw_page), which then poison category_discriminativeness and
# every per-category table. Probe before crawling so we fail fast, before the
# extractor mutates raw_pages/votes, and alert with an actionable message
# instead of on_error's generic tail-of-log.
begin_step "llm-preflight"
if [ -z "$LLM_API_KEY" ]; then
  tg "🗳️ [voting_similarities] ❌ Clé LLM absente — crawl/parse ignorés, données non mises à jour.
Vérifier le secret LLM_API_KEY du dépôt (il doit être dans *secrets*, pas *variables*).
run: ${RUN_URL}"
  exit 1
fi
llm_http="$(curl -s -o /dev/null -w '%{http_code}' -m 20 \
  -H "Authorization: Bearer ${LLM_API_KEY}" \
  "${LLM_BASE_URL}/models" || true)"
echo "llm_preflight_http=$llm_http"
if [ "$llm_http" != "200" ]; then
  tg "🗳️ [voting_similarities] ❌ Clé LLM invalide (HTTP ${llm_http:-000}) — crawl/parse ignorés, données non mises à jour.
Vérifier/régénérer le secret LLM_API_KEY du dépôt.
run: ${RUN_URL}"
  exit 1
fi

# --- 2. Baseline counts -------------------------------------------------------
begin_step "counts-before"
votes_before="$(psql_count "SELECT COUNT(*) FROM votes")"
empty_before="$(psql_count "SELECT COUNT(*) FROM votes WHERE categories IS NULL OR categories = '{}'")"
raw_max_before="$(psql_count "SELECT COALESCE(MAX(scrutin_id), 0) FROM raw_pages")"
count_raw="$(podman exec "$CONTAINER" python3 /app/scripts/ingest_real_data.py --count-votes 2>/dev/null || true)"
app_votes_before="$(printf '%s' "$count_raw" | tr -cd '0-9')"
if [ -z "$app_votes_before" ]; then
  echo "WARNING: could not read the app DB vote count (stale voting-backend image?); assuming 0 -> forcing a re-ingest."
  app_votes_before=0
fi
echo "votes_before=$votes_before empty_before=$empty_before raw_max_before=$raw_max_before app_votes_before=$app_votes_before"

# --- 3. Crawl + parse + recategorize ------------------------------------------
begin_step "crawl"
run_extractor crawl --source "$SOURCE"

# --- 3b. Reconcile legacy raw_pages: a page whose scrutin already has a vote
#         is done — never let parse re-process (and re-LLM) the historical cache.
begin_step "reconcile"
reconciled="$(podman exec "$PG_CONTAINER" psql -U postgres -d "$MAIN_DB" -t -A \
  -c "UPDATE raw_pages rp SET processed = TRUE FROM votes v WHERE v.scrutin_id = rp.scrutin_id AND NOT rp.processed" \
  | awk '{print $2}')"
echo "reconciled=$reconciled"

# --- 3c. Fast path: nothing new crawled & nothing pending → skip parse/LLM -----
# Also skip when the two DBs have drifted (a previous ingest failed), otherwise
# the stranded votes would be reported as "aucun nouveau vote" forever.
begin_step "fast-path-check"
raw_max_after="$(psql_count "SELECT COALESCE(MAX(scrutin_id), 0) FROM raw_pages")"
votes_now="$(psql_count "SELECT COUNT(*) FROM votes")"
unprocessed="$(psql_count "SELECT COUNT(*) FROM raw_pages WHERE processed = FALSE")"
echo "raw_max_after=$raw_max_after votes_now=$votes_now unprocessed=$unprocessed app_votes_before=$app_votes_before"
if [ "$votes_now" -eq "$votes_before" ] && [ "$raw_max_after" -eq "$raw_max_before" ] && [ "$unprocessed" -eq 0 ] \
   && [ "$votes_now" -eq "$app_votes_before" ]; then
  DATE_LABEL="$(date '+%d/%m/%Y %H:%M')"
  tg "🗳️ [voting_similarities] OK — ${DATE_LABEL} : aucun nouveau vote."
  exit 0
fi
if [ "$votes_now" -ne "$app_votes_before" ]; then
  DRIFT=1
  echo "DRIFT detected: parliament has $votes_now vote(s), app DB has $app_votes_before — forcing ingest."
fi

begin_step "parse"
run_extractor parse --source "$SOURCE"
begin_step "recategorize"
run_extractor parse --source "$SOURCE" --recategorize

# --- 4. After counts ----------------------------------------------------------
begin_step "counts-after"
votes_after="$(psql_count "SELECT COUNT(*) FROM votes")"
empty_after="$(psql_count "SELECT COUNT(*) FROM votes WHERE categories IS NULL OR categories = '{}'")"
new_votes=$((votes_after - votes_before))
recategorized=$((empty_before - empty_after))
echo "votes_after=$votes_after empty_after=$empty_after"
echo "new_votes=$new_votes recategorized=$recategorized"

DATE_LABEL="$(date '+%d/%m/%Y %H:%M')"

if [ "$new_votes" -eq 0 ] && [ "$recategorized" -le 0 ] && [ -z "${DRIFT:-}" ]; then
  tg "🗳️ [voting_similarities] OK — ${DATE_LABEL} : aucun nouveau vote."
  exit 0
fi

# --- 5. Ingest into the voting_similarities DB --------------------------------
begin_step "ingest"
podman exec -e "PARLIAMENT_DB_URL=$PARLIAMENT_DB_URL" "$CONTAINER" \
  python3 /app/scripts/ingest_real_data.py

# --- 6. Recompute every existing config set -----------------------------------
begin_step "get-config-sets"
cfg_list="$(podman exec "$CONTAINER" python3 /app/scripts/get_config_sets.py || true)"
if [ -z "$cfg_list" ]; then
  cfg_list=$'Defaut\t1.0\t0.2\t0.5\t10'
fi

while IFS=$'\t' read -r cname w_yes w_no w_mismatch m; do
  [ -n "$cname" ] || continue
  begin_step "compute:$cname"
  podman exec "$CONTAINER" python3 /app/scripts/compute_similarities.py \
    --name "$cname" \
    --w-yes "$w_yes" --w-no "$w_no" --w-mismatch "$w_mismatch" --m "$m"
done <<< "$cfg_list"

# --- 7. Restart backend -------------------------------------------------------
begin_step "restart"
podman restart "$CONTAINER"
for _ in $(seq 1 30); do
  if curl -fsS http://localhost:8000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
curl -fsS http://localhost:8000/api/health >/dev/null

# --- 8. Success ---------------------------------------------------------------
tg "🗳️ [voting_similarities] OK — ${DATE_LABEL} : ${new_votes} nouveau(x) vote(s) importé(s) (+${recategorized} recatégorisé(s)). Similarités recalculées, backend redémarré."