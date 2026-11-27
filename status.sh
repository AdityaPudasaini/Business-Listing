#!/usr/bin/env bash
# status.sh -- checks that AutoHub is healthy. It only reads: it changes nothing and never prints a secret.
#
#   sudo bash status.sh
#
# Run it from the install folder. It shows the version, whether the four containers and the API are
# healthy, free disk space, the newest backup and whether the daily backup is scheduled, which required
# settings in .env are filled in, and whether the website answers over HTTPS.
# If something is wrong, copy the whole output into your message to support.
#
# Exit code: 0 if no problem was found, 1 if at least one problem was found.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")" || exit 2

if [ -t 1 ]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
  BOLD=""; RED=""; GREEN=""; YELLOW=""; RESET=""
fi
PROBLEMS=0
WARNINGS=0
head_() { printf '\n%s%s%s\n' "$BOLD" "$*" "$RESET"; }
good()  { printf '  %s ok %s  %s\n' "$GREEN" "$RESET" "$*"; }
note()  { printf '  %swarn%s  %s\n' "$YELLOW" "$RESET" "$*"; WARNINGS=$((WARNINGS + 1)); }
bad()   { printf '  %s BAD%s  %s\n' "$RED" "$RESET" "$*"; PROBLEMS=$((PROBLEMS + 1)); }

usage() { sed -n '2,/^set -uo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \{0,1\}//'; }
case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  "") ;;
  *) echo "Unknown option: $1 (see --help)." >&2; exit 2 ;;
esac

[ -f docker-compose.yml ] || { echo "docker-compose.yml not found. Run this script from the AutoHub install folder." >&2; exit 2; }
command -v docker >/dev/null 2>&1 || { echo "Docker is not installed or not on PATH." >&2; exit 2; }
docker info >/dev/null 2>&1 || { echo "Cannot talk to Docker. Run this as root:  sudo bash status.sh" >&2; exit 2; }

# Reads one value from .env (the value is only tested for being empty, never printed, except for domains).
env_get() { { grep -E "^$1=" .env 2>/dev/null || true; } | tail -n1 | cut -d= -f2- | tr -d '\r'; }

printf '%sAutoHub status%s   %s   (%s)\n' "$BOLD" "$RESET" "$(date '+%Y-%m-%d %H:%M %Z')" "$PWD"

# ------------------------------------------------------------------ version
head_ "Version"
if [ -f VERSION ]; then good "AutoHub $(tr -d '\r\n ' < VERSION)"; else note "VERSION file not found."; fi

# ------------------------------------------------------------------ containers
head_ "Containers"
for svc in db backend frontend caddy; do
  id="$(docker compose ps -q "$svc" 2>/dev/null || true)"
  if [ -z "$id" ]; then bad "$svc: not running. Start the site with:  docker compose up -d"; continue; fi
  info="$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.State.Restarting}}' "$id" 2>/dev/null || echo "missing|none|false")"
  state="${info%%|*}"; rest="${info#*|}"; health="${rest%%|*}"; restarting="${rest#*|}"
  if [ "$state" != "running" ]; then bad "$svc: $state"
  elif [ "$restarting" = "true" ]; then bad "$svc: keeps restarting. See:  docker compose logs --tail 50 $svc"
  elif [ "$health" = "unhealthy" ]; then bad "$svc: running but unhealthy. See:  docker compose logs --tail 50 $svc"
  elif [ "$health" = "starting" ]; then note "$svc: still starting; run this again in a minute."
  elif [ "$health" = "healthy" ]; then good "$svc: running, healthy"
  else good "$svc: running"
  fi
done

if command -v timeout >/dev/null 2>&1; then
  # </dev/null: the command must not read the terminal (it would be stopped, and could swallow typed input).
  if timeout 25 docker compose exec -T backend node -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" </dev/null >/dev/null 2>&1; then
    good "API answers its health check"
  else
    bad "API does not answer its health check. See:  docker compose logs --tail 50 backend"
  fi
fi

# ------------------------------------------------------------------ disk
head_ "Disk space"
avail_gb="$(df -BG --output=avail . 2>/dev/null | tail -n1 | tr -dc '0-9')"
if [ -z "$avail_gb" ]; then note "Could not read the free disk space."
elif [ "$avail_gb" -lt 2 ]; then bad "Only ${avail_gb} GB free. Free space now (for example:  docker image prune), or the site and backups will fail."
elif [ "$avail_gb" -lt 5 ]; then note "${avail_gb} GB free. An update needs at least 5 GB."
else good "${avail_gb} GB free"
fi

# ------------------------------------------------------------------ backups
head_ "Backups"
newest="$(ls -1t backups/autohub-*.dmp 2>/dev/null | head -n1 || true)"
if [ -z "$newest" ]; then
  bad "No backup found in backups/. Make one now:  sudo bash ops/backup/backup.sh"
else
  age_h=$(( ( $(date +%s) - $(stat -c %Y "$newest") ) / 3600 ))
  size_k=$(( $(stat -c %s "$newest") / 1024 ))
  if [ "$size_k" -eq 0 ]; then bad "The newest backup is empty: $newest"
  elif [ "$age_h" -gt 36 ]; then note "The newest backup is $age_h hours old ($(basename "$newest")). The daily backup may not be running."
  else good "Newest backup is $age_h hours old ($(basename "$newest"), ${size_k} KB)"
  fi
fi
if [ -f /etc/cron.d/autohub-backup ]; then good "Daily backup is scheduled (/etc/cron.d/autohub-backup)"
else note "No daily backup is scheduled. Run the installer's schedule again, or back up by hand now and then."
fi
last_check="$(grep 'weekly check:' backups/verify.log 2>/dev/null | tail -n1 || true)"
if [ -z "$last_check" ]; then
  printf '  %sinfo%s  The weekly restore check has not run yet (it runs on Sundays at 03:30). Run it now:  sudo bash ops/backup/restore.sh verify-latest\n' "$BOLD" "$RESET"
elif printf '%s' "$last_check" | grep -q 'weekly check: OK'; then
  check_days=$(( ( $(date +%s) - $(stat -c %Y backups/verify.log) ) / 86400 ))
  if [ "$check_days" -gt 9 ]; then note "The last restore check passed, but it was $check_days days ago. The weekly check may not be running."
  else good "Last weekly restore check passed ($check_days days ago)"
  fi
else
  bad "The last weekly restore check FAILED. Look at backups/verify.log, then make a new backup:  sudo bash ops/backup/backup.sh"
fi

# ------------------------------------------------------------------ settings
head_ "Settings (.env)"
if [ ! -f .env ]; then
  bad ".env not found."
else
  for key in APP_DOMAIN API_DOMAIN ACME_EMAIL POSTGRES_PASSWORD JWT_SECRET; do
    if [ -n "$(env_get "$key")" ]; then good "$key is set"; else bad "$key is empty. Set it in .env, then:  docker compose up -d"; fi
  done
  if [ -n "$(env_get SMTP_HOST)" ]; then good "Email (SMTP) is set up"
  else note "Email is not set up, so password reset and email confirmation will not work. Run:  sudo bash setup-smtp.sh"
  fi
fi

# ------------------------------------------------------------------ website
head_ "Website"
app="$(env_get APP_DOMAIN)"; api="$(env_get API_DOMAIN)"
if command -v curl >/dev/null 2>&1 && [ -n "$app" ] && [ -n "$api" ]; then
  for url in "https://$app/" "https://$api/health"; do
    if curl -fsS --max-time 10 -o /dev/null "$url" 2>/dev/null; then good "$url answers"
    else note "$url did not answer. Check DNS, the firewall (ports 80 and 443) and:  docker compose logs caddy"
    fi
  done
else
  note "Skipped the HTTPS check (curl or the domains are missing)."
fi

# ------------------------------------------------------------------ result
echo
if [ "$PROBLEMS" -gt 0 ]; then
  printf '%s%s problem(s) found%s, %s warning(s). Fix the BAD lines above first.\n' "$RED" "$PROBLEMS" "$RESET" "$WARNINGS"
  exit 1
fi
if [ "$WARNINGS" -gt 0 ]; then
  printf '%sNo problems%s, %s warning(s) to look at.\n' "$GREEN" "$RESET" "$WARNINGS"
else
  printf '%sEverything looks good.%s\n' "$GREEN" "$RESET"
fi
exit 0
