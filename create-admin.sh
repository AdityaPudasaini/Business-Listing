#!/usr/bin/env bash
# create-admin.sh -- create an admin account, or reset the password of an existing one.
#
#   sudo bash create-admin.sh                 (asks for the email, name and password)
#   sudo bash create-admin.sh you@example.com
#
# Use it when the admin password is lost and email (SMTP) is not working yet, or to add another
# admin. Run it from the install folder, with the site running.
#
# If the email already exists: its password is replaced, it becomes an admin, the account is unlocked
# and unbanned, and every old login of that account is signed out. Otherwise a new admin is created.
# The password is typed hidden and is never printed, logged or put on a command line.
#
# The web installer at /install stays locked: this script does not open it again.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -t 1 ]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
  BOLD=""; RED=""; GREEN=""; YELLOW=""; RESET=""
fi
info() { printf '%s==>%s %s\n' "$BOLD" "$RESET" "$*"; }
ok()   { printf '%s ok%s  %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%swarn%s %s\n' "$YELLOW" "$RESET" "$*" >&2; }
die()  { printf '%sERROR%s %s\n' "$RED" "$RESET" "$*" >&2; exit 1; }

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \{0,1\}//'; }

EMAIL=""
for arg in "$@"; do
  case "$arg" in
    -h|--help) usage; exit 0 ;;
    -*) die "Unknown option: $arg (see --help)." ;;
    *) [ -z "$EMAIL" ] || die "Give one email address only."; EMAIL="$arg" ;;
  esac
done

[ -f docker-compose.yml ] || die "docker-compose.yml not found. Run this script from the AutoHub install folder."
[ "$(id -u)" -eq 0 ] || die "Run this as root:  sudo bash create-admin.sh"
[ -t 0 ] || die "This script asks questions, so it needs a terminal."
command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || die "Docker with the Compose plugin is required."

backend_id="$(docker compose ps -q backend 2>/dev/null || true)"
[ -n "$backend_id" ] && [ "$(docker inspect --format '{{.State.Status}}' "$backend_id" 2>/dev/null)" = "running" ] \
  || die "The site is not running. Start it first:  docker compose up -d"

valid_email() { [[ "$1" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; }
# Same rules as the website and the API: 8 to 72 characters, an uppercase letter and a number.
valid_password() { [ "${#1}" -ge 8 ] && [ "${#1}" -le 72 ] && [[ "$1" =~ [A-Z] ]] && [[ "$1" =~ [0-9] ]]; }

if [ -z "$EMAIL" ]; then
  read -r -p "Admin email: " EMAIL
fi
EMAIL="$(printf '%s' "$EMAIL" | tr -d '[:space:]')"
valid_email "$EMAIL" || die "'$EMAIL' is not a valid email address."

read -r -p "Name (used only if this creates a new account; Enter for \"Admin\"): " NAME
NAME="${NAME:-Admin}"

PASSWORD=""
for attempt in 1 2 3; do
  read -r -s -p "New password (8 to 72 characters, an uppercase letter and a number): " PASSWORD; echo
  if ! valid_password "$PASSWORD"; then
    warn "That password does not meet the rules."; PASSWORD=""
    [ "$attempt" -lt 3 ] || die "Too many tries. Run the script again."
    continue
  fi
  read -r -s -p "Type it again: " again; echo
  if [ "$PASSWORD" = "$again" ]; then break; fi
  warn "The two passwords are different."; PASSWORD=""
  [ "$attempt" -lt 3 ] || die "Too many tries. Run the script again."
done
[ -n "$PASSWORD" ] || die "No password was set."

echo
echo "This will create the admin account $EMAIL, or, if it already exists, replace its password,"
echo "make it an admin, unlock it, and sign it out everywhere."
read -r -p "Continue? [y/N] " yn
case "$yn" in [yY]|[yY][eE][sS]) ;; *) die "Cancelled. Nothing was changed." ;; esac

# The values go in through standard input (three lines), never as arguments.
printf '%s\n%s\n%s\n' "$EMAIL" "$NAME" "$PASSWORD" | docker compose exec -T backend node scripts/create-admin.js \
  || die "The account was not changed. Read the message above."
unset PASSWORD again

app_domain="$({ grep -E '^APP_DOMAIN=' .env 2>/dev/null || true; } | tail -n1 | cut -d= -f2- | tr -d '\r')"
echo
if [ -n "$app_domain" ]; then
  ok "Log in at https://$app_domain/admin/login"
else
  ok "Done. Log in at /admin/login on your website."
fi
