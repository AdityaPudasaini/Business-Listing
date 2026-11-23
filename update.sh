#!/usr/bin/env bash
# update.sh -- updates an installed AutoHub to the version in this folder.
#
#   1. Download and unzip the NEW AutoHub package into a new folder (do not unzip over the old one).
#   2. From inside the new folder run:
#
#        sudo bash update.sh
#
# The script finds the installed AutoHub by itself (it asks Docker where the running site lives).
# If it cannot, or you run several installations, give the folder:
#        sudo bash update.sh /path/to/installed-autohub        (example: sudo bash update.sh /opt/autohub)
#
# What it does:
#   - backs up the database and the uploaded images first (into backups/ of the installed folder);
#     if the backup fails, nothing is changed
#   - replaces the program files of the installed folder with the new ones; the old ones are kept
#     in previous-version/ (only the last one is kept)
#   - keeps .env (your settings and secrets), backups/ and install-credentials.txt untouched;
#     settings that only the new version knows about are added to .env with their default values
#   - rebuilds and restarts the site; database migrations are applied when the API starts
#   - waits until the API is healthy and checks the HTTPS addresses
#   - at the end, offers to delete the old program files (previous-version/) and the unpacked
#     update folder, so no old copy is left behind (with --clean it does so without asking)
#
# If you already unpacked the new files OVER the installed folder, run this inside that folder
# without a path:  sudo bash update.sh   (it then only backs up, rebuilds and restarts).
#
# Options:
#   --dry-run      show what would happen; change nothing
#   --yes, -y      do not ask for confirmation (for scripts)
#   --clean        after a successful update, delete previous-version/ and the unpacked update
#                  folder without asking (you can then no longer go back without a restore)
#   --skip-backup  do not back up first (not recommended; use only for a site with no data yet)
#   --no-verify    do not wait for the HTTPS check at the end
#   --help, -h     show this help
set -euo pipefail

# ------------------------------------------------------------------ output helpers
if [ -t 1 ]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
  BOLD=""; RED=""; GREEN=""; YELLOW=""; RESET=""
fi
info() { printf '%s==>%s %s\n' "$BOLD" "$RESET" "$*"; }
ok()   { printf '%s ok%s  %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%swarn%s %s\n' "$YELLOW" "$RESET" "$*" >&2; }
die()  { printf '%sERROR%s %s\n' "$RED" "$RESET" "$*" >&2; exit 1; }
SELF="${BASH_SOURCE[0]}"
usage() { sed -n '2,/^set -euo pipefail/p' "$SELF" | sed '$d' | sed 's/^# \{0,1\}//'; }

DRY_RUN=0; ASSUME_YES=0; SKIP_BACKUP=0; VERIFY=1; CLEAN=0; TARGET_ARG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    --skip-backup) SKIP_BACKUP=1; shift ;;
    --clean) CLEAN=1; shift ;;
    --no-verify) VERIFY=0; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) die "Unknown option: $1 (see --help)." ;;
    *) [ -z "$TARGET_ARG" ] || die "Give only one folder. Usage: sudo bash update.sh /path/to/installed-autohub"
       TARGET_ARG="$1"; shift ;;
  esac
done

# Everything except the final call is wrapped in functions, and the script ends with "main; exit":
# bash reads a running script lazily, and this file is itself one of the files that gets replaced.

run() { if [ "$DRY_RUN" -eq 1 ]; then printf '  + %s\n' "$*"; else "$@"; fi; }

confirm() { # confirm "question" -> 0 = yes
  [ "$ASSUME_YES" -eq 1 ] && return 0
  [ -t 0 ] || return 1
  local answer
  read -r -p "$1 [y/N] " answer || return 1
  case "$answer" in [yY]|[yY][eE][sS]) return 0 ;; *) return 1 ;; esac
}

env_get() { # env_get KEY -> value from .env (empty if missing)
  [ -f .env ] || return 0
  { grep -E "^$1=" .env || true; } | tail -n1 | cut -d= -f2- | tr -d '\r'
}

# Sets KEY=value in a file: replaces the line if present, appends it otherwise (same as install.sh).
set_env() { # set_env FILE KEY VALUE
  local file="$1" tmp
  tmp="$(mktemp "$file.XXXXXX")"
  KEY="$2" VAL="$3" awk '
    BEGIN { k = ENVIRON["KEY"]; v = ENVIRON["VAL"]; done = 0 }
    index($0, k "=") == 1 { print k "=" v; done = 1; next }
    { print }
    END { if (!done) print k "=" v }
  ' "$file" > "$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$file"
}

read_version() { # read_version DIR -> first line of DIR/VERSION, or "unknown"
  if [ -s "$1/VERSION" ]; then head -n1 "$1/VERSION" | tr -d '\r'; else printf 'unknown'; fi
}

# The program files that an update replaces. Anything else in the folder (.env, backups/,
# install-credentials.txt, your own files) is never touched.
MANAGED=(backend frontend deploy ops docs docker-compose.yml install.sh setup-smtp.sh create-admin.sh update.sh .env.example .gitattributes README.md VERSION)
MOVED=()

restore_code() { # puts the old program files back (used when the copy fails half way)
  local item
  for item in "${MANAGED[@]}"; do rm -rf "${TARGET:?}/$item"; done
  for item in "${MOVED[@]}"; do mv "$PREV/$item" "$TARGET/$item" || warn "Could not put back $item; it is in $PREV."; done
  rmdir "$PREV" 2>/dev/null || true
}

replace_code() {
  local item
  PREV="$TARGET/previous-version"
  rm -rf "$PREV"; mkdir -p "$PREV" || return 1
  for item in "${MANAGED[@]}"; do
    if [ -e "$TARGET/$item" ]; then mv "$TARGET/$item" "$PREV/$item" || return 1; MOVED+=("$item"); fi
  done
  for item in "${MANAGED[@]}"; do
    [ -e "$SRC/$item" ] || continue
    cp -a "$SRC/$item" "$TARGET/$item" || return 1
  done
}

# Adds settings that the new .env.example has and .env lacks (never changes an existing value).
topup_env() {
  [ -f .env.example ] || return 0
  local line key missing=()
  while IFS= read -r line; do
    line="${line%$'\r'}"; key="${line%%=*}"
    [ -n "$(grep -E "^${key}=" .env || true)" ] || missing+=("$line")
  done < <(grep -E '^[A-Z][A-Z0-9_]*=' .env.example || true)
  [ "${#missing[@]}" -gt 0 ] || return 0
  ENV_BACKUP=".env.bak-update-$(date +%Y%m%d-%H%M%S)"
  cp -p .env "$ENV_BACKUP"; chmod 600 "$ENV_BACKUP"
  for line in "${missing[@]}"; do set_env .env "${line%%=*}" "${line#*=}"; done
  ADDED_KEYS="$(printf '%s ' "${missing[@]%%=*}")"
}

# Finds the folder of the running AutoHub: Docker labels every container of the compose project
# "autohub" with the folder it was started from. Prints one folder; returns 1 if there is none,
# 2 if there are several different ones.
detect_installed() {
  command -v docker >/dev/null 2>&1 || return 1
  local dirs d n=0 found="" seen=" " list=""
  dirs="$(docker ps -a --filter label=com.docker.compose.project=autohub \
            --format '{{.Label "com.docker.compose.project.working_dir"}}' 2>/dev/null | sort -u || true)"
  while IFS= read -r d; do
    [ -n "$d" ] || continue
    [ -f "$d/docker-compose.yml" ] && [ -f "$d/.env" ] || continue
    d="$(cd "$d" && pwd -P)" || continue
    case "$seen" in *" $d "*) continue ;; esac
    seen="$seen$d "; n=$((n + 1)); found="$d"
    list="$list  $d"$'\n'
  done <<< "$dirs"
  [ "$n" -ge 1 ] || return 1
  if [ "$n" -gt 1 ]; then printf '%s' "$list"; return 2; fi
  printf '%s' "$found"
}

# True if it is safe to delete the unpacked update folder $1: it is a real package, not the
# installation, not above or inside it, and not a system or home folder.
safe_to_delete_package() {
  local pkg="$1" tgt="$2" home_dir
  home_dir="$(cd ~ 2>/dev/null && pwd -P || true)"
  case "$pkg" in ""|/|/root|/home|/opt|/usr|/var|/etc|/srv|/mnt|/tmp) return 1 ;; esac
  [ "$pkg" != "$home_dir" ] || return 1
  [ -f "$pkg/docker-compose.yml" ] && [ -d "$pkg/backend" ] && [ -d "$pkg/frontend" ] || return 1
  [ ! -e "$pkg/.env" ] || return 1
  case "$tgt/" in "$pkg"/*) return 1 ;; esac
  case "$pkg/" in "$tgt"/*) return 1 ;; esac
  return 0
}

# Offers (or, with --clean, does) the removal of the old program files and the unpacked update.
cleanup_old() {
  local pkg_ok=0
  safe_to_delete_package "$SRC" "$TARGET" && pkg_ok=1
  if [ "$IN_PLACE" -eq 1 ]; then [ -d "$TARGET/previous-version" ] || return 0; fi
  [ "$HTTPS_OK" -eq 1 ] || { echo "Cleanup skipped: the HTTPS check failed, so keep the old files until the site works."; return 0; }
  echo
  if [ "$CLEAN" -eq 0 ]; then
    echo "Old copies still on disk:"
    [ ! -d "$TARGET/previous-version" ] || echo "  - $TARGET/previous-version/   (the old program files; needed to go back)"
    [ "$pkg_ok" -eq 0 ] || echo "  - $SRC   (the unpacked update; no longer needed)"
    # --yes only skips the update question; it never deletes (that takes --clean or a typed y).
    if [ "$ASSUME_YES" -eq 1 ] || [ ! -t 0 ]; then
      echo "Kept. Delete them later by hand, or run the update with --clean."; return 0
    fi
    local answer
    read -r -p "Delete them now? Your site, data, .env and backups stay. [y/N] " answer || return 0
    case "$answer" in [yY]|[yY][eE][sS]) ;; *) echo "Kept. Delete them later by hand when you are happy with the update."; return 0 ;; esac
  fi
  rm -rf "${TARGET:?}/previous-version"
  ok "Old program files deleted (.env, backups/ and install-credentials.txt were not touched)."
  if [ "$pkg_ok" -eq 1 ] && [ "$IN_PLACE" -eq 0 ]; then
    cd "$TARGET"
    rm -rf "${SRC:?}" && ok "Unpacked update folder deleted: $SRC"
  elif [ "$IN_PLACE" -eq 0 ]; then
    echo "The update folder $SRC was left alone (it is not safe to delete automatically)."
  fi
}

backend_health() {
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    "$(docker compose ps -q backend)" 2>/dev/null || echo missing
}

wait_for_backend() {
  info "Waiting for the API to become healthy (database migrations are applied on start)..."
  local deadline=$((SECONDS + 300))
  until [ "$(backend_health)" = "healthy" ]; do
    if [ "$SECONDS" -ge "$deadline" ]; then
      docker compose logs --tail 30 backend || true
      return 1
    fi
    sleep 3
  done
  ok "The API is healthy."
}

wait_for_url() { # wait_for_url URL -> 0 when it answers over HTTPS
  local i
  for i in $(seq 1 24); do
    curl -fsS --max-time 10 -o /dev/null "$1" 2>/dev/null && return 0
    sleep 5
  done
  return 1
}

HTTPS_OK=1
verify_https() {
  local app api url
  app="$(env_get APP_DOMAIN)"; api="$(env_get API_DOMAIN)"
  [ -n "$app" ] && [ -n "$api" ] || return 0
  info "Checking the HTTPS addresses..."
  for url in "https://$api/health" "https://$app/"; do
    if wait_for_url "$url"; then ok "$url answers."
    else warn "$url did not answer."; HTTPS_OK=0; fi
  done
  [ "$HTTPS_OK" -eq 1 ] || echo "     See what Caddy says with:  docker compose logs caddy"
}

failed_update() { # failed_update "what happened"
  echo >&2
  warn "$1"
  echo "Your data is safe: the backup taken before the update is in $TARGET/backups/." >&2
  if [ "$IN_PLACE" -eq 0 ]; then
    echo "The previous program files are in $TARGET/previous-version/." >&2
    echo "To go back to the previous version (run these inside $TARGET):" >&2
    echo "  sudo cp -a previous-version/. ." >&2
    [ "$SKIP_BACKUP" -eq 1 ] || echo "  sudo ./ops/backup/restore.sh restore backups/<the .dmp file>  backups/<the uploads .tar.gz file>" >&2
    echo "  sudo docker compose up -d --build" >&2
  fi
  echo "Look at the API log with:  docker compose logs --tail 50 backend" >&2
  exit 1
}

main() {
  SRC="$(cd "$(dirname "$SELF")" && pwd -P)"
  local det rc
  if [ -n "$TARGET_ARG" ]; then
    [ -d "$TARGET_ARG" ] || die "The folder '$TARGET_ARG' does not exist."
    TARGET="$(cd "$TARGET_ARG" && pwd -P)"
  else
    set +e; det="$(detect_installed)"; rc=$?; set -e
    if [ "$rc" -eq 0 ]; then
      TARGET="$det"; info "Found the installed AutoHub: $TARGET"
    elif [ "$rc" -eq 2 ]; then
      printf '%s\n' "$det" >&2
      die "Several AutoHub installations are running (listed above). Choose one:  sudo bash update.sh /path/to/installed-autohub"
    elif [ -f "$SRC/.env" ]; then
      TARGET="$SRC"   # files were unpacked over the installation
    else
      die "Could not find a running AutoHub. Start it first (docker compose up -d in its folder), or give the folder:  sudo bash update.sh /path/to/installed-autohub"
    fi
  fi
  IN_PLACE=0; [ "$TARGET" != "$SRC" ] || IN_PLACE=1
  ADDED_KEYS=""; ENV_BACKUP=""

  [ -f "$SRC/docker-compose.yml" ] && [ -d "$SRC/backend" ] && [ -d "$SRC/frontend" ] \
    || die "This folder does not look like an AutoHub package (docker-compose.yml, backend/ or frontend/ is missing)."
  if [ ! -f "$TARGET/docker-compose.yml" ] || [ ! -f "$TARGET/.env" ]; then
    if [ "$IN_PLACE" -eq 1 ]; then
      die "There is no installed AutoHub here (no .env). To update an installation elsewhere, run:  sudo bash update.sh /path/to/installed-autohub"
    fi
    die "'$TARGET' is not an installed AutoHub (docker-compose.yml or .env is missing)."
  fi

  [ "$DRY_RUN" -eq 0 ] || info "Dry run: nothing will be changed."
  if [ "$DRY_RUN" -eq 0 ]; then [ "$(id -u)" -eq 0 ] || die "Run this as root:  sudo bash update.sh ..."; fi
  command -v docker >/dev/null 2>&1 || die "Docker is not installed or not on PATH."
  docker compose version >/dev/null 2>&1 || die "The Docker Compose plugin is missing."

  cd "$TARGET"
  local disk_gb old_v new_v
  disk_gb="$(df -BG --output=avail . | tail -n1 | tr -dc '0-9')"
  [ "${disk_gb:-0}" -ge 5 ] || die "Only ${disk_gb:-0} GB of disk space is free; at least 5 GB is needed to rebuild."

  old_v="$(read_version "$TARGET")"; new_v="$(read_version "$SRC")"
  info "Installed folder: $TARGET"
  if [ "$IN_PLACE" -eq 1 ]; then
    echo "  Mode           : files were already replaced here; back up, rebuild and restart"
    echo "  Version        : $new_v"
  else
    echo "  Installed      : version $old_v"
    echo "  Updating to    : version $new_v   (from $SRC)"
    if [ "$old_v" != "unknown" ] && [ "$old_v" = "$new_v" ]; then warn "Both are version $old_v. Continuing will reinstall the same files."; fi
  fi
  echo "  Kept as they are: .env, backups/, install-credentials.txt"
  [ "$SKIP_BACKUP" -eq 0 ] || warn "--skip-backup: NO backup will be taken."
  confirm "Update now? The site is rebuilt and restarted (a short interruption)." || die "Cancelled. Nothing was changed."

  # 1. Backup. Nothing has been changed yet, so a failure here is harmless.
  if [ "$SKIP_BACKUP" -eq 0 ]; then
    info "Backing up the database and the uploaded images..."
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "  + bash $SRC/ops/backup/backup.sh   (in $TARGET)"
    else
      [ -n "$(docker compose ps -q db 2>/dev/null)" ] \
        || die "The site is not running, so there is nothing to back up. Start it (docker compose up -d), or use --skip-backup if it holds no data yet."
      [ -f "$SRC/ops/backup/backup.sh" ] || die "ops/backup/backup.sh is missing from the new package."
      bash "$SRC/ops/backup/backup.sh" || die "The backup failed, so the update was stopped before changing anything."
      ok "Backup finished (see the files above in $TARGET/backups/)."
    fi
  fi

  # 2. Replace the program files.
  if [ "$IN_PLACE" -eq 0 ]; then
    info "Replacing the program files (the old ones go to previous-version/)..."
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "  + move ${MANAGED[*]} to previous-version/, then copy the new ones from $SRC"
    else
      if ! replace_code; then restore_code; die "Copying the new files failed; the old files were put back. Nothing else was changed."; fi
      ok "Program files replaced."
    fi
  fi

  # 3. New settings, then check Docker Compose can read everything.
  info "Checking the settings..."
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  + add settings that are new in .env.example to .env (existing values are never changed)"
  else
    topup_env
    [ -z "$ADDED_KEYS" ] || ok "Added new settings to .env with their default values: $ADDED_KEYS"
    if ! cfg_err="$(docker compose config -q 2>&1)"; then
      [ -z "$ENV_BACKUP" ] || cp -p "$ENV_BACKUP" .env
      [ "$IN_PLACE" -eq 1 ] || restore_code
      printf '%s\n' "$cfg_err" | head -n 5 >&2
      die "Docker Compose cannot read the new configuration; the previous files and .env were put back. Nothing was rebuilt."
    fi
    ok "The configuration is valid."
  fi

  # 4. Rebuild and restart.
  info "Rebuilding and restarting (this takes several minutes)..."
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  + docker compose up -d --build"
    echo "  + afterwards: offer to delete previous-version/ and the unpacked update folder (or do it with --clean)"
    info "Dry run finished. Run again without --dry-run to update."
    return 0
  fi
  docker compose up -d --build || failed_update "The rebuild failed. The site may be stopped."
  wait_for_backend || failed_update "The API did not become healthy within 5 minutes."
  if [ "$VERIFY" -eq 1 ]; then verify_https; fi

  echo
  echo "${BOLD}Update finished.${RESET} Now running: version $new_v"
  [ "$SKIP_BACKUP" -eq 1 ] || echo "  Backup taken before the update: $TARGET/backups/"
  [ "$IN_PLACE" -eq 1 ] || echo "  Previous program files        : $TARGET/previous-version/ (delete it when you are happy)"
  echo "  Free disk space from old builds with:  docker image prune"
  if [ "$HTTPS_OK" -eq 0 ]; then warn "The HTTPS addresses did not answer yet; check DNS and the firewall, then open the site."; fi
  cleanup_old
  return 0
}

trap 'rc=$?; [ "$rc" -eq 0 ] || printf "\nThe update stopped. Read the messages above for what was and was not changed.\n" >&2' EXIT
main
exit $?
