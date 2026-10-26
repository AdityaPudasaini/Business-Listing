#!/usr/bin/env bash
# ops/deploy/deploy.sh -- put a new version live on the server, and undo it automatically if
# it does not come up healthy. Run on the server by the CI/CD pipeline (or by hand):
#
#   ./ops/deploy/deploy.sh sha-1a2b3c4
#
# What it does:
#   1. takes a backup (skipped on the very first deploy)
#   2. pulls the new images
#   3. restarts the changed containers (the backend applies database migrations on start)
#   4. waits for the backend to report healthy
#   5. if it never does, puts the previous version back and exits with an error
#
# Optional settings: ALLOW_DEPLOY_WITHOUT_BACKUP=1, HEALTH_TIMEOUT=180 (seconds)
set -euo pipefail

TAG="${1:-}"
if [[ ! "$TAG" =~ ^(latest|sha-[0-9a-f]{7,40})$ ]]; then
  echo "Usage: $0 <image-tag>   (for example sha-1a2b3c4)" >&2
  exit 1
fi

cd "$(dirname "$0")/../.."
COMPOSE="${COMPOSE:-docker compose}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"

[ -f .env ] || { echo "ERROR: .env not found in $(pwd)" >&2; exit 1; }
grep -qE '^IMAGE_PREFIX=.+' .env || {
  echo "ERROR: set IMAGE_PREFIX in .env, for example IMAGE_PREFIX=ghcr.io/your-github-name/autohub" >&2
  exit 1
}

get_tag() { grep -E '^IMAGE_TAG=' .env | tail -n1 | cut -d= -f2- || true; }
set_tag() {
  if grep -qE '^IMAGE_TAG=' .env; then
    sed -i "s|^IMAGE_TAG=.*|IMAGE_TAG=$1|" .env
  else
    printf '\nIMAGE_TAG=%s\n' "$1" >> .env
  fi
}
backend_health() {
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    "$($COMPOSE ps -q backend)" 2>/dev/null || echo "missing"
}
wait_until_healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT))
  until [ "$(backend_health)" = "healthy" ]; do
    [ "$SECONDS" -lt "$deadline" ] || return 1
    sleep 3
  done
  $COMPOSE ps --status running --services | grep -qx frontend
}

PREVIOUS="$(get_tag)"
echo "Deploying $TAG (currently running: ${PREVIOUS:-nothing})"

# 1. Backup before anything changes. Never deploy without a way back.
if $COMPOSE ps --status running --services 2>/dev/null | grep -qx backend; then
  echo "Taking a backup first..."
  if ! ./ops/backup/backup.sh; then
    if [ "${ALLOW_DEPLOY_WITHOUT_BACKUP:-0}" = "1" ]; then
      echo "WARNING: the backup failed; continuing because ALLOW_DEPLOY_WITHOUT_BACKUP=1."
    else
      echo "ERROR: the backup failed, so nothing was deployed." >&2
      exit 1
    fi
  fi
else
  echo "Nothing is running yet (first deploy), so there is nothing to back up."
fi

# 2. New images
set_tag "$TAG"
if ! $COMPOSE pull backend frontend; then
  set_tag "$PREVIOUS"
  echo "ERROR: could not pull the images for $TAG. Nothing was changed." >&2
  echo "       Is the server logged in to the registry? (docker login ghcr.io)" >&2
  exit 1
fi

# 3. Restart on the new version
$COMPOSE up -d --remove-orphans

# 4. Did it come up?
if wait_until_healthy; then
  docker image prune -f > /dev/null || true
  echo "Deployed $TAG successfully."
  exit 0
fi

# 5. It did not: show why, then go back to the previous version.
echo "ERROR: $TAG did not become healthy within ${HEALTH_TIMEOUT}s." >&2
$COMPOSE logs --tail=60 backend || true
if [ -n "$PREVIOUS" ] && [ "$PREVIOUS" != "$TAG" ]; then
  echo "Rolling back to $PREVIOUS..." >&2
  set_tag "$PREVIOUS"
  $COMPOSE pull backend frontend || true
  $COMPOSE up -d --remove-orphans
  echo "Rolled back to $PREVIOUS. The failed release is NOT live." >&2
else
  echo "There is no earlier version to roll back to." >&2
fi
exit 1
