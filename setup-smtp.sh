#!/usr/bin/env bash
# setup-smtp.sh -- sets up outgoing email (password reset, email confirmation, contact messages)
# for AutoHub. It asks a few questions, saves the answers in .env and restarts the API only.
#
#   sudo bash setup-smtp.sh
#
# Safe to run again: it shows your current values as defaults, keeps your saved password when you
# just press Enter, and saves a copy of .env first (.env.bak-<date>, readable by root only).
# The password is typed hidden and is never put on a command line or printed.
#
# Gmail: use smtp.gmail.com, port 587, and an APP PASSWORD (Google account > Security > 2-Step
# Verification > App passwords). Your normal Gmail password does not work.
#
# Options:
#   --no-restart   save the settings but do not restart the API (apply later with:
#                  docker compose up -d --force-recreate backend)
#   --help, -h     show this help
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

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
usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \{0,1\}//'; }

RESTART=1
while [ $# -gt 0 ]; do
  case "$1" in
    --no-restart) RESTART=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1 (see --help)." ;;
  esac
done

# ------------------------------------------------------------------ .env helpers
env_get() { # env_get KEY -> raw value from .env (empty if missing)
  [ -f .env ] || return 0
  { grep -E "^$1=" .env || true; } | tail -n1 | cut -d= -f2- | tr -d '\r'
}

env_plain() { # env_plain KEY -> value with one pair of surrounding quotes removed (for defaults only)
  local v; v="$(env_get "$1")"
  case "$v" in
    \'*\') v="${v#\'}"; v="${v%\'}" ;;
    \"*\") v="${v#\"}"; v="${v%\"}" ;;
  esac
  printf '%s' "$v"
}

# Sets KEY=value in a file: replaces the line if present, appends it otherwise. The value goes
# through the environment, so characters like \ & $ are never interpreted. (Same as in install.sh.)
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

# Docker Compose reads .env itself: an unquoted $ would be treated as a variable and " #" as a
# comment. A value in single quotes is taken literally, so every value is stored that way. A value
# that cannot be single-quoted (it contains ' or a control character) is refused, not mangled.
env_quote() { # env_quote VALUE -> prints the value ready for .env; returns 1 if it cannot be stored safely
  local v="$1"
  [ -n "$v" ] || return 0
  case "$v" in *"'"*) return 1 ;; esac
  if [[ "$v" =~ [[:cntrl:]] ]]; then return 1; fi
  printf "'%s'" "$v"
}

# ------------------------------------------------------------------ questions
trim() { local s="$1"; s="${s#"${s%%[![:space:]]*}"}"; s="${s%"${s##*[![:space:]]}"}"; printf '%s' "$s"; }

ask() { # ask VAR "Question" "default" -> Enter keeps the default
  local __var="$1" __q="$2" __def="${3:-}" __ans
  if [ -n "$__def" ]; then
    read -r -p "$__q [$__def]: " __ans || die "Cancelled."
    __ans="$(trim "$__ans")"; __ans="${__ans:-$__def}"
  else
    read -r -p "$__q: " __ans || die "Cancelled."
    __ans="$(trim "$__ans")"
  fi
  printf -v "$__var" '%s' "$__ans"
}

ask_valid() { # ask_valid VAR "Question" "default" validator "message shown when invalid"
  local tries=0 val
  while :; do
    ask val "$2" "$3"
    if "$4" "$val"; then printf -v "$1" '%s' "$val"; return 0; fi
    tries=$((tries + 1))
    [ "$tries" -lt 3 ] || die "Too many invalid answers. Run this again when you are ready."
    warn "$5"
  done
}

valid_host()  { [[ "$1" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ ]]; }
valid_port()  { [[ "$1" =~ ^[0-9]{1,5}$ ]] && [ "$1" -ge 1 ] && [ "$1" -le 65535 ]; }
valid_email() { [[ "$1" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; }
valid_login() { # empty means "no login"; otherwise no spaces, quotes or control characters
  [ -z "$1" ] && return 0
  [[ "$1" =~ [[:space:][:cntrl:]\'\"] ]] && return 1
  return 0
}
valid_name()  { [ -n "$1" ] && [ "${#1}" -le 60 ] && ! [[ "$1" =~ [\"\'\<\>\\[:cntrl:]] ]]; }

# ------------------------------------------------------------------ checks
[ "$(id -u)" -eq 0 ] || die "Run this as root:  sudo bash setup-smtp.sh"
[ -f docker-compose.yml ] || die "docker-compose.yml not found. Run this script from the unpacked AutoHub folder."
[ -f .env ] || die ".env not found. Run  sudo bash install.sh  first."
[ -t 0 ] || die "This script asks questions, so it needs a terminal (it cannot read answers from a pipe)."
command -v docker >/dev/null 2>&1 || die "Docker is not installed or not on PATH."

# ------------------------------------------------------------------ main
info "Email setup for AutoHub (press Enter to accept the value in [brackets])"
echo "Gmail: smtp.gmail.com, port 587, and an app password (not your normal password)."
echo

cur_port="$(env_plain SMTP_PORT)"; cur_port="${cur_port:-587}"
cur_host="$(env_plain SMTP_HOST)"; cur_host="${cur_host:-}"
cur_user="$(env_plain SMTP_USER)"
cur_inbox="$(env_plain CONTACT_INBOX_EMAIL)"
has_pass=0; [ -z "$(env_get SMTP_PASS)" ] || has_pass=1

ask_valid HOST "SMTP server" "${cur_host:-smtp.gmail.com}" valid_host "That is not a valid server name (example: smtp.gmail.com)."
ask_valid PORT "Port (587 = STARTTLS, 465 = SSL)" "$cur_port" valid_port "The port must be a number from 1 to 65535."
if [ "$PORT" = "465" ]; then SECURE="true"; SECURE_TEXT="SSL"; else SECURE="false"; SECURE_TEXT="STARTTLS"; fi
ask_valid LOGIN "Username (usually your full email address; type - for a server without login)" "$cur_user" valid_login \
  "The username cannot contain spaces or quote characters."
[ "$LOGIN" != "-" ] || LOGIN=""

PASS=""; KEEP_PASS=0
if [ -n "$LOGIN" ]; then
  tries=0
  while :; do
    if [ "$has_pass" -eq 1 ]; then read -r -s -p "Password (hidden; press Enter to keep the saved one): " PASS || die "Cancelled."
    else read -r -s -p "Password (hidden): " PASS || die "Cancelled."; fi
    echo
    if [ -z "$PASS" ] && [ "$has_pass" -eq 1 ]; then KEEP_PASS=1; break; fi
    if [ -n "$PASS" ]; then
      # Google shows app passwords as four groups of four letters; the spaces are not part of it.
      if [ "$HOST" = "smtp.gmail.com" ] && [[ "$PASS" =~ ^[a-z]{4}(\ [a-z]{4}){3}$ ]]; then
        PASS="${PASS// /}"; echo "  (removed the spaces from the Gmail app password)"
      fi
      if env_quote "$PASS" >/dev/null; then echo "  (${#PASS} characters)"; break; fi
      warn "That password contains a single quote or a control character, which cannot be stored safely in .env. Use a password without them (for Gmail, an app password never has any)."
    fi
    tries=$((tries + 1)); [ "$tries" -lt 3 ] || die "No usable password was entered."
  done
fi

default_sender="$(printf '%s' "$LOGIN" | grep -E '@' || true)"
cur_from="$(env_plain MAIL_FROM)"
if [ -z "$default_sender" ] && [[ "$cur_from" =~ \<([^\>]+)\> ]]; then default_sender="${BASH_REMATCH[1]}"; fi
ask_valid SENDER_ADDR "Sender address (the From: address on every email)" "$default_sender" valid_email \
  "That is not a valid email address."
cur_name="AutoHub"
if [[ "$cur_from" =~ ^\"([^\"]+)\" ]]; then cur_name="${BASH_REMATCH[1]}"; fi
ask_valid SENDER_NAME "Sender name shown to recipients" "$cur_name" valid_name \
  "The name cannot be empty or contain quotes, < > or backslashes."
ask_valid INBOX "Where should messages from the contact form be delivered?" "${cur_inbox:-$SENDER_ADDR}" valid_email \
  "That is not a valid email address."

MAIL_FROM_VALUE="\"$SENDER_NAME\" <$SENDER_ADDR>"
echo
info "Please check:"
echo "  Server : $HOST  port $PORT  ($SECURE_TEXT)"
if [ -z "$LOGIN" ]; then echo "  Login  : none"
elif [ "$KEEP_PASS" -eq 1 ]; then echo "  Login  : $LOGIN  (saved password kept)"
else echo "  Login  : $LOGIN  (new password, hidden)"; fi
echo "  Sender : $MAIL_FROM_VALUE"
echo "  Contact form messages go to: $INBOX"
read -r -p "Save these settings? [Y/n] " yn || die "Cancelled."
case "$yn" in [nN]*) die "Cancelled. Nothing was changed." ;; esac

# Quote everything first, so nothing is written if one value is refused.
q_host="$(env_quote "$HOST")"; q_port="$(env_quote "$PORT")"; q_secure="$(env_quote "$SECURE")"
q_user="$(env_quote "$LOGIN")"; q_from="$(env_quote "$MAIL_FROM_VALUE")" || die "The sender name or address cannot be stored safely."
q_inbox="$(env_quote "$INBOX")"
q_pass=""; if [ "$KEEP_PASS" -eq 0 ] && [ -n "$LOGIN" ]; then q_pass="$(env_quote "$PASS")" || die "The password cannot be stored safely."; fi

backup=".env.bak-$(date +%Y%m%d-%H%M%S)"
cp -p .env "$backup"; chmod 600 "$backup"
ok "Saved a copy of the old settings as $backup (it contains your secrets: keep it private or delete it)."

set_env .env SMTP_HOST "$q_host"
set_env .env SMTP_PORT "$q_port"
set_env .env SMTP_SECURE "$q_secure"
set_env .env SMTP_USER "$q_user"
if [ -z "$LOGIN" ]; then set_env .env SMTP_PASS ""
elif [ "$KEEP_PASS" -eq 0 ]; then set_env .env SMTP_PASS "$q_pass"; fi
set_env .env MAIL_FROM "$q_from"
set_env .env CONTACT_INBOX_EMAIL "$q_inbox"
chmod 600 .env
PASS=""; q_pass=""   # no longer needed
ok "Settings saved in .env."

# Docker Compose must still be able to read the file; if not, put the old one back.
if ! cfg_err="$(docker compose config -q 2>&1)"; then
  cp -p "$backup" .env
  printf '%s\n' "$cfg_err" | head -n 5 >&2
  die "Docker Compose could not read the new .env, so the old one was restored. Nothing was changed."
fi

if [ "$RESTART" -eq 0 ]; then
  echo
  echo "Not restarting (--no-restart). Apply the settings with:  docker compose up -d --force-recreate backend"
  exit 0
fi

# Restart only the API. Its startup checks the SMTP connection and logs the result.
since="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
info "Restarting the API (the website and database keep running)..."
docker compose up -d --no-deps --force-recreate backend >/dev/null 2>&1 || die "Could not restart the API. Look at:  docker compose logs --tail 30 backend"

backend_health() {
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    "$(docker compose ps -q backend)" 2>/dev/null || echo missing
}
deadline=$((SECONDS + 180))
until [ "$(backend_health)" = "healthy" ]; do
  if [ "$SECONDS" -ge "$deadline" ]; then
    docker compose logs --tail 30 backend || true
    die "The API did not become healthy within 3 minutes. The last log lines are above."
  fi
  sleep 3
done
ok "The API is running again."

info "Testing the email connection..."
result=""
for _ in $(seq 1 20); do
  result="$(docker compose logs --no-color --since "$since" backend 2>&1 \
    | grep -E 'SMTP (ready|connection FAILED)' | tail -n1 | sed 's/\x1b\[[0-9;]*m//g' || true)"
  [ -z "$result" ] || break
  sleep 3
done

case "$result" in
  *"SMTP ready"*)
    ok "Connected to $HOST and logged in. Emails will be delivered."
    echo
    read -r -p "Send a test email to $INBOX now? [y/N] " yn || yn="n"
    case "$yn" in [yY]*)
      if docker compose exec -T -e TEST_TO="$INBOX" backend node -e '
        const n = require("nodemailer");
        const t = n.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
        t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: process.env.TEST_TO,
          subject: "AutoHub test email", text: "This is a test email from your AutoHub installation. Email is working." })
          .then(() => console.log("SENT")).catch((e) => { console.log("FAILED: " + e.message); process.exit(1); });
      ' | tail -n 1 | grep -q '^SENT$'; then
        ok "Test email sent to $INBOX. Check the inbox (and the spam folder)."
      else
        warn "The test email could not be sent. The login worked, so check that the sender address is allowed by your provider."
      fi ;;
    esac
    ;;
  *"SMTP connection FAILED"*)
    warn "${result##*] }"
    echo "The settings are saved, but the connection failed. Common causes:"
    echo "  - Gmail: use an app password, not your normal password"
    echo "  - wrong port (587 for STARTTLS, 465 for SSL) or a firewall blocking outgoing mail"
    echo "Run  sudo bash setup-smtp.sh  again to correct it."
    exit 1
    ;;
  *)
    warn "No answer from the API about the email connection yet. Check:  docker compose logs --tail 30 backend"
    exit 1
    ;;
esac

echo
echo "Note: REQUIRE_EMAIL_VERIFICATION is on by default, so new accounts must confirm their email."
echo "Keep email working, or nobody can finish signing up (the admin account is exempt)."
