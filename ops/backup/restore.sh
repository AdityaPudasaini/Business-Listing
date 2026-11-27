#!/usr/bin/env bash
# ops/backup/restore.sh -- check a backup, or restore one.
#
#   ./ops/backup/restore.sh verify  backups/autohub-YYYYMMDD-HHMMSS.dmp
#       Restores into a throw-away database, prints row counts, deletes it. Safe: the live
#       database is never touched. Do this regularly -- a backup you have never restored is
#       only a hope.
#
#   ./ops/backup/restore.sh verify-latest
#       The same check on the newest backup in backups/ (or $BACKUP_DIR). install.sh schedules it
#       weekly (Sundays 03:30) and it writes one line to backups/verify.log: "weekly check: OK" or
#       "weekly check: FAILED". `sudo bash status.sh` shows the last result.
#
#   ./ops/backup/restore.sh restore backups/autohub-YYYYMMDD-HHMMSS.dmp [backups/autohub-uploads-YYYYMMDD-HHMMSS.tar.gz]
#       REPLACES the live database (and the uploaded images, if you pass the second file).
#
# Run from the repository root. Decrypt .gpg files first:  gpg --decrypt file.gpg > file
set -euo pipefail

COMPOSE="${COMPOSE:-docker compose}"
mode="${1:-}"
dump="${2:-}"
uploads="${3:-}"

usage() {
  sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

if [ "$mode" = "verify-latest" ]; then
  # Picks the newest database backup, and logs how the check ended (also when it fails).
  check_skipped=0
  trap 'rc=$?; if [ "$rc" -ne 0 ]; then echo "[$(date -Iseconds)] weekly check: FAILED (exit $rc)"; elif [ "$check_skipped" -eq 1 ]; then echo "[$(date -Iseconds)] weekly check: SKIPPED (the backups are encrypted)"; else echo "[$(date -Iseconds)] weekly check: OK"; fi' EXIT
  dump="$(ls -1t "${BACKUP_DIR:-./backups}"/autohub-*.dmp 2>/dev/null | head -n1 || true)"
  if [ -z "$dump" ]; then
    # Encrypted backups (GPG_RECIPIENT) leave only .dmp.gpg files, which cannot be read without the key.
    if ls "${BACKUP_DIR:-./backups}"/autohub-*.dmp.gpg >/dev/null 2>&1; then
      echo "The backups in ${BACKUP_DIR:-./backups} are encrypted (.gpg), so they cannot be checked automatically."
      echo "Decrypt one now and then and run:  ./ops/backup/restore.sh verify <file>.dmp"
      check_skipped=1
      exit 0
    fi
    echo "No backup found in ${BACKUP_DIR:-./backups}." >&2; exit 1
  fi
  echo "[$(date -Iseconds)] Checking the newest backup: $dump"
  mode=verify
fi

[ -n "$mode" ] && [ -f "$dump" ] || usage

psql_db() { $COMPOSE exec -T db psql -U autohub -d postgres -v ON_ERROR_STOP=1 "$@"; }

case "$mode" in
  verify)
    echo "Restoring into a temporary database (restore_check)..."
    psql_db -c 'DROP DATABASE IF EXISTS restore_check;'
    psql_db -c 'CREATE DATABASE restore_check;'
    $COMPOSE exec -T db pg_restore -U autohub -d restore_check --no-owner < "$dump"
    echo "Row counts in the backup:"
    $COMPOSE exec -T db psql -U autohub -d restore_check -c \
      'SELECT (SELECT count(*) FROM "User") AS users, (SELECT count(*) FROM "Business") AS businesses, (SELECT count(*) FROM "Review") AS reviews, (SELECT count(*) FROM "AuditLog") AS audit_rows;'
    psql_db -c 'DROP DATABASE restore_check;'
    echo "OK: the backup restores cleanly."
    ;;

  restore)
    echo "This REPLACES the live database${uploads:+ and the uploaded images} with the backup."
    read -r -p "Type 'restore' to continue: " answer
    [ "$answer" = "restore" ] || { echo "Cancelled."; exit 1; }

    $COMPOSE stop backend
    psql_db -c 'DROP DATABASE IF EXISTS autohub WITH (FORCE);'
    psql_db -c 'CREATE DATABASE autohub OWNER autohub;'
    $COMPOSE exec -T db pg_restore -U autohub -d autohub --no-owner < "$dump"

    if [ -n "$uploads" ]; then
      [ -f "$uploads" ] || { echo "Uploads archive not found: $uploads" >&2; exit 1; }
      $COMPOSE run --rm --no-deps -T backend sh -c 'rm -rf /app/uploads/* && tar -xzf - -C /app/uploads' < "$uploads"
    fi

    $COMPOSE start backend
    echo "Restore finished. The backend is starting again."
    ;;

  *)
    usage
    ;;
esac
