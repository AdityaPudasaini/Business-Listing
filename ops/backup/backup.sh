#!/usr/bin/env bash
# ops/backup/backup.sh -- back up the production database and the uploaded images.
#
# Run it from the repository root (where docker-compose.yml is). From cron, daily at 02:00:
#   0 2 * * * cd /opt/autohub && ./ops/backup/backup.sh >> backups/backup.log 2>&1
#
# Optional settings (environment variables):
#   BACKUP_DIR      where backups go                         (default ./backups)
#   KEEP_DAYS       delete local backups older than this     (default 14)
#   GPG_RECIPIENT   encrypt every file for this GPG key id/email before storing it
#   RCLONE_REMOTE   also copy every file off-site with rclone, e.g. "r2:autohub-backups"
#
# The backup contains real user data (emails, password hashes, chats). Keep it private,
# and prefer GPG_RECIPIENT whenever a copy leaves this server.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
COMPOSE="${COMPOSE:-docker compose}"
STAMP="$(date +%Y%m%d-%H%M%S)"

umask 077
mkdir -p "$BACKUP_DIR"

DB_FILE="$BACKUP_DIR/autohub-$STAMP.dmp"
UPLOADS_FILE="$BACKUP_DIR/autohub-uploads-$STAMP.tar.gz"

echo "[$(date -Is)] Backing up the database..."
$COMPOSE exec -T db pg_dump -U autohub -d autohub -Fc --no-owner --no-privileges > "$DB_FILE"
if [ ! -s "$DB_FILE" ]; then
  echo "ERROR: the database dump is empty." >&2
  rm -f "$DB_FILE"
  exit 1
fi

echo "[$(date -Is)] Backing up uploaded images..."
$COMPOSE exec -T backend tar -C /app/uploads -czf - . > "$UPLOADS_FILE"
# Confirms the archive can be read back. (Whether the database dump actually restores is
# checked by:  ./ops/backup/restore.sh verify <file>.dmp  -- run that now and then.)
tar -tzf "$UPLOADS_FILE" > /dev/null

for file in "$DB_FILE" "$UPLOADS_FILE"; do
  if [ -n "${GPG_RECIPIENT:-}" ]; then
    gpg --batch --yes --trust-model always --encrypt --recipient "$GPG_RECIPIENT" "$file"
    rm -f "$file"
    file="$file.gpg"
  fi
  if [ -n "${RCLONE_REMOTE:-}" ]; then
    rclone copy "$file" "$RCLONE_REMOTE"
  fi
  echo "  saved $(basename "$file") ($(du -h "$file" | cut -f1))"
done

echo "[$(date -Is)] Removing local backups older than $KEEP_DAYS days..."
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'autohub-*' -mtime "+$KEEP_DAYS" -delete

echo "[$(date -Is)] Backup finished."
