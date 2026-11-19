#!/usr/bin/env bash
# install.sh -- one-command installer for AutoHub (Docker Compose package).
#
#   sudo bash install.sh <domain> <admin-email> [options]
#   sudo bash install.sh example.com you@example.com
#   sudo bash install.sh --app-domain shop.example.com --api-domain api.example.com you@example.com
#
# Before you run it, point two DNS A records at this server:
#   app.<domain>   (the website)      api.<domain>   (the API)
#
# What it does. It is safe to run again: it never replaces an existing .env and never touches the
# database.
#   1. checks the server (Ubuntu 22.04/24.04 or Debian 12, memory, disk, free ports 80 and 443)
#   2. installs Docker and the Compose plugin if they are missing
#   3. writes .env with fresh random secrets (POSTGRES_PASSWORD, JWT_SECRET, SETUP_CODE)
#   4. builds and starts the site (database, API, website, Caddy for HTTPS)
#   5. waits until it is healthy and checks the HTTPS addresses
#   6. prints the web installer address and the one-time setup code
#
# Options:
#   --app-domain HOST     use HOST for the website instead of app.<domain>
#   --api-domain HOST     use HOST for the API instead of api.<domain>
#                         (both names must share one parent domain: the login cookie needs it)
#   --dry-run             show what would happen; change nothing
#   --yes, -y             never ask questions (for scripts)
#   --skip-checks         skip the system, port and DNS checks
#   --skip-docker-install do not install Docker; stop if it is missing
#   --no-verify           do not wait for the HTTPS check at the end
#   --help, -h            show this help
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

# ------------------------------------------------------------------ arguments
DOMAIN=""; EMAIL=""; APP_DOMAIN_ARG=""; API_DOMAIN_ARG=""
DRY_RUN=0; ASSUME_YES=0; SKIP_CHECKS=0; SKIP_DOCKER=0; VERIFY=1
POSITIONAL=()

while [ $# -gt 0 ]; do
  case "$1" in
    --app-domain) [ $# -ge 2 ] || die "--app-domain needs a value."; APP_DOMAIN_ARG="$2"; shift 2 ;;
    --api-domain) [ $# -ge 2 ] || die "--api-domain needs a value."; API_DOMAIN_ARG="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    --skip-checks) SKIP_CHECKS=1; shift ;;
    --skip-docker-install) SKIP_DOCKER=1; shift ;;
    --no-verify) VERIFY=0; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) die "Unknown option: $1 (see --help)." ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done
if [ -n "$APP_DOMAIN_ARG$API_DOMAIN_ARG" ]; then
  # With --app-domain/--api-domain the only positional argument is the email address.
  if [ "${#POSITIONAL[@]}" -gt 1 ]; then die "Too many arguments. Usage: sudo bash install.sh --app-domain A --api-domain B <admin-email>"; fi
  if [ "${#POSITIONAL[@]}" -eq 1 ]; then EMAIL="${POSITIONAL[0]}"; fi
else
  if [ "${#POSITIONAL[@]}" -gt 2 ]; then die "Too many arguments. Usage: sudo bash install.sh <domain> <admin-email>"; fi
  if [ "${#POSITIONAL[@]}" -ge 1 ]; then DOMAIN="${POSITIONAL[0]}"; fi
  if [ "${#POSITIONAL[@]}" -ge 2 ]; then EMAIL="${POSITIONAL[1]}"; fi
fi

# ------------------------------------------------------------------ small helpers
run() {
  if [ "$DRY_RUN" -eq 1 ]; then printf '  + %s\n' "$*"; else "$@"; fi
}

confirm() { # confirm "question" -> 0 = yes
  [ "$ASSUME_YES" -eq 1 ] && return 0
  [ -t 0 ] || return 1
  local answer
  read -r -p "$1 [y/N] " answer || return 1
  case "$answer" in [yY]|[yY][eE][sS]) return 0 ;; *) return 1 ;; esac
}

rand_hex() { head -c "$1" /dev/urandom | od -An -vtx1 | tr -d ' \n'; } # N random bytes as 2N hex chars

env_get() { # env_get KEY -> value from .env (empty if missing)
  [ -f .env ] || return 0
  { grep -E "^$1=" .env || true; } | tail -n1 | cut -d= -f2- | tr -d '\r'
}

# Sets KEY=value in a file: replaces the line if present, appends it otherwise. The value goes
# through the environment, so characters like \ & $ are never interpreted.
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

valid_host() { [[ "$1" =~ ^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$ ]]; }
# Names that can never get a public HTTPS certificate.
reserved_tld() { case "${1##*.}" in localhost|local|test|invalid|lan|internal|home|corp) return 0 ;; esac; return 1; }
valid_email() { [[ "$1" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; }
os_field() { ( . /etc/os-release 2>/dev/null; printf '%s' "${!1:-}" ); }

# ------------------------------------------------------------------ steps
need_root() {
  [ "$DRY_RUN" -eq 1 ] && return 0
  [ "$(id -u)" -eq 0 ] || die "Run this as root:  sudo bash install.sh ..."
}

check_os() {
  local id version
  id="$(os_field ID)"; version="$(os_field VERSION_ID)"
  case "$id:$version" in
    ubuntu:22.04|ubuntu:24.04|debian:12) ok "Operating system: $id $version" ;;
    *) if [ "$SKIP_CHECKS" -eq 1 ]; then warn "Untested system ($id $version); continuing."
       else die "Supported systems: Ubuntu 22.04/24.04 and Debian 12 (this one is: ${id:-unknown} ${version:-}). Use --skip-checks to try anyway."; fi ;;
  esac
}

check_resources() {
  local mem_kb disk_gb
  mem_kb="$(awk '/^MemTotal:/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
  if [ "$mem_kb" -lt 1800000 ]; then
    warn "This server has under 2 GB of memory. Building the website may fail; adding 2 GB of swap helps."
  else
    ok "Memory: $((mem_kb / 1024)) MB"
  fi
  disk_gb="$(df -BG --output=avail . | tail -n1 | tr -dc '0-9')"
  if [ "${disk_gb:-0}" -lt 5 ]; then
    die "Only ${disk_gb:-0} GB of disk space is free here; at least 5 GB is needed for the images and the build."
  fi
  ok "Free disk space: ${disk_gb} GB"
}

install_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    ok "Docker and the Compose plugin are installed."
    return 0
  fi
  if command -v docker >/dev/null 2>&1; then
    die "Docker is installed but the Compose plugin is missing. Install it (package docker-compose-plugin or docker-compose-v2) and run this again."
  fi
  [ "$SKIP_DOCKER" -eq 0 ] || die "Docker is required (you used --skip-docker-install)."

  local id codename
  id="$(os_field ID)"; codename="$(os_field VERSION_CODENAME)"
  case "$id" in ubuntu|debian) ;; *) die "Automatic Docker installation supports Ubuntu and Debian only. Install Docker, then run this again." ;; esac

  info "Installing Docker from Docker's official apt repository..."
  export DEBIAN_FRONTEND=noninteractive
  run apt-get update -y
  run apt-get install -y ca-certificates curl gnupg
  run install -m 0755 -d /etc/apt/keyrings
  run curl -fsSL "https://download.docker.com/linux/$id/gpg" -o /etc/apt/keyrings/docker.asc
  run chmod a+r /etc/apt/keyrings/docker.asc
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  + write /etc/apt/sources.list.d/docker.list"
  else
    printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/%s %s stable\n' \
      "$(dpkg --print-architecture)" "$id" "$codename" > /etc/apt/sources.list.d/docker.list
  fi
  run apt-get update -y
  run apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  run systemctl enable --now docker
  [ "$DRY_RUN" -eq 1 ] || docker compose version >/dev/null 2>&1 || die "Docker was installed but 'docker compose' does not work."
  ok "Docker installed."
}

ensure_curl() {
  command -v curl >/dev/null 2>&1 && return 0
  info "Installing curl..."
  run apt-get install -y curl
}

check_ports() {
  command -v ss >/dev/null 2>&1 || return 0
  # Our own Caddy container already holds the ports on a re-run: that is fine.
  if docker compose ps -q caddy 2>/dev/null | grep -q .; then ok "Ports 80 and 443 are used by this site's Caddy."; return 0; fi
  local busy
  busy="$(ss -ltnH 2>/dev/null | awk '{print $4}' | grep -E ':(80|443)$' || true)"
  if [ -n "$busy" ]; then
    die "Port 80 or 443 is already in use on this server (another web server such as Apache or nginx?). Stop it first, because the site needs both ports for HTTPS."
  fi
  ok "Ports 80 and 443 are free."
}

check_dns() {
  local ip host found
  ip="$(curl -4 -fsS --max-time 6 https://api.ipify.org 2>/dev/null || true)"
  if [ -z "$ip" ]; then warn "Could not detect this server's public IP, so the DNS check is skipped."; return 0; fi
  local problem=0
  for host in "$APP_DOMAIN" "$API_DOMAIN"; do
    found="$(getent ahostsv4 "$host" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ' || true)"
    if [ -z "$found" ]; then
      warn "$host has no DNS record yet. Create an A record for it pointing at $ip."; problem=1
    elif [[ " $found " != *" $ip "* ]]; then
      warn "$host points to ${found}but this server is $ip."; problem=1
    else
      ok "$host points at this server ($ip)."
    fi
  done
  if [ "$problem" -eq 1 ]; then
    echo "     HTTPS certificates cannot be issued until both names point here, and repeated failures can"
    echo "     make the certificate provider pause you for a while."
    confirm "Continue anyway?" || die "Fix the DNS records, wait a few minutes, and run this again."
  fi
}

open_firewall() {
  command -v ufw >/dev/null 2>&1 || return 0
  ufw status 2>/dev/null | grep -q '^Status: active' || return 0
  info "ufw is active: allowing ports 80 and 443."
  run ufw allow 80/tcp
  run ufw allow 443/tcp
  run ufw allow 443/udp
}

# Decides APP_DOMAIN, API_DOMAIN and ACME_EMAIL, from .env if it exists, otherwise from the arguments.
resolve_settings() {
  local want_app="" want_api=""
  if [ -n "$APP_DOMAIN_ARG" ] || [ -n "$API_DOMAIN_ARG" ]; then
    [ -n "$APP_DOMAIN_ARG" ] && [ -n "$API_DOMAIN_ARG" ] || die "Give both --app-domain and --api-domain, or neither."
    want_app="${APP_DOMAIN_ARG,,}"; want_api="${API_DOMAIN_ARG,,}"
  elif [ -n "$DOMAIN" ]; then
    want_app="app.${DOMAIN,,}"; want_api="api.${DOMAIN,,}"
  fi

  if [ -f .env ]; then
    APP_DOMAIN="$(env_get APP_DOMAIN)"; API_DOMAIN="$(env_get API_DOMAIN)"; ACME_EMAIL="$(env_get ACME_EMAIL)"
    if [ -n "$want_app" ] && { [ "$want_app" != "$APP_DOMAIN" ] || [ "$want_api" != "$API_DOMAIN" ]; }; then
      die "This folder is already set up for $APP_DOMAIN and $API_DOMAIN. To change the domain, edit APP_DOMAIN and API_DOMAIN in .env, then run:  docker compose up -d --build"
    fi
  else
    [ -n "$want_app" ] || die "Usage: sudo bash install.sh <domain> <admin-email>   (example: sudo bash install.sh example.com you@example.com)"
    [ -n "$EMAIL" ] || die "Give an email address for certificate notices:  sudo bash install.sh $DOMAIN you@example.com"
    APP_DOMAIN="$want_app"; API_DOMAIN="$want_api"; ACME_EMAIL="$EMAIL"
  fi

  valid_host "$APP_DOMAIN" || die "'$APP_DOMAIN' is not a valid domain name (an IP address or 'localhost' cannot get an HTTPS certificate)."
  valid_host "$API_DOMAIN" || die "'$API_DOMAIN' is not a valid domain name."
  if reserved_tld "$APP_DOMAIN" || reserved_tld "$API_DOMAIN"; then
    die "Names ending in .localhost, .local, .test, .lan and similar cannot get a public HTTPS certificate. Use a real domain."
  fi
  valid_email "$ACME_EMAIL" || die "'$ACME_EMAIL' is not a valid email address."
  [ "$APP_DOMAIN" != "$API_DOMAIN" ] || die "The website and the API need two different names."
  if [ "${APP_DOMAIN#*.}" != "${API_DOMAIN#*.}" ]; then
    warn "$APP_DOMAIN and $API_DOMAIN do not share one parent domain. Login would fail: the cookie needs both on the same site."
    [ "$SKIP_CHECKS" -eq 1 ] || die "Use two names under one parent domain, for example app.example.com and api.example.com (or add --skip-checks if you know what you are doing)."
  fi
}

SETUP_CODE_VALUE=""
write_env() {
  if [ -f .env ]; then
    info "Keeping the existing .env (secrets are never regenerated: the database would stop working)."
    SETUP_CODE_VALUE="$(env_get SETUP_CODE)"
    if [ "${#SETUP_CODE_VALUE}" -lt 16 ]; then
      SETUP_CODE_VALUE="$(rand_hex 12)"
      if [ "$DRY_RUN" -eq 1 ]; then echo "  + add a new SETUP_CODE to .env"; else set_env .env SETUP_CODE "$SETUP_CODE_VALUE"; fi
    fi
    return 0
  fi

  [ -f .env.example ] || die ".env.example is missing from this folder."
  info "Writing .env with new random secrets..."
  SETUP_CODE_VALUE="$(rand_hex 12)"
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  + create .env from .env.example (APP_DOMAIN=$APP_DOMAIN, API_DOMAIN=$API_DOMAIN, new secrets)"
    return 0
  fi
  ( umask 077; tr -d '\r' < .env.example > .env )
  chmod 600 .env
  set_env .env APP_DOMAIN "$APP_DOMAIN"
  set_env .env API_DOMAIN "$API_DOMAIN"
  set_env .env ACME_EMAIL "$ACME_EMAIL"
  set_env .env POSTGRES_PASSWORD "$(rand_hex 24)"
  set_env .env JWT_SECRET "$(rand_hex 32)"
  set_env .env SETUP_CODE "$SETUP_CODE_VALUE"
  ok ".env written (readable by root only)."
}

backend_health() {
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    "$(docker compose ps -q backend)" 2>/dev/null || echo missing
}

wait_for_backend() {
  info "Waiting for the API to become healthy (the first start applies the database migrations)..."
  local deadline=$((SECONDS + 300))
  until [ "$(backend_health)" = "healthy" ]; do
    if [ "$SECONDS" -ge "$deadline" ]; then
      docker compose logs --tail 30 backend || true
      die "The API did not become healthy within 5 minutes. The last log lines are above."
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
  info "Checking the HTTPS addresses (the first certificates can take a minute)..."
  local url
  for url in "https://$API_DOMAIN/health" "https://$APP_DOMAIN/"; do
    if wait_for_url "$url"; then ok "$url answers."
    else warn "$url did not answer yet."; HTTPS_OK=0; fi
  done
  if [ "$HTTPS_OK" -eq 0 ]; then
    echo "     Usual causes: a DNS record that does not point here yet, or ports 80/443 blocked by a firewall."
    echo "     See what Caddy says with:  docker compose logs caddy"
  fi
}

site_installed() { # prints yes, no or unknown
  docker compose exec -T backend node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/setup/status').then(r=>r.json()).then(j=>process.stdout.write(j.installed?'yes':'no')).catch(()=>process.stdout.write('unknown'))" 2>/dev/null || echo unknown
}

save_credentials() {
  ( umask 077
    cat > install-credentials.txt <<EOF
AutoHub setup details (created $(date -Is))

Web installer : https://$APP_DOMAIN/install
Setup code    : $SETUP_CODE_VALUE

The code works once: after the first admin account exists it is refused.
Delete this file when the installation is done:  rm install-credentials.txt
Your database password and login secret are in .env (readable by root only).
EOF
  )
}

summary() {
  local installed
  installed="$(site_installed)"
  echo
  echo "${BOLD}AutoHub is running.${RESET}"
  echo "  Website : https://$APP_DOMAIN"
  echo "  API     : https://$API_DOMAIN"
  echo
  if [ "$installed" = "yes" ]; then
    echo "The site is already installed. Admin area: https://$APP_DOMAIN/admin"
  else
    save_credentials
    echo "${BOLD}Next step:${RESET} open  https://$APP_DOMAIN/install"
    echo "and enter this one-time setup code:"
    echo
    echo "    $SETUP_CODE_VALUE"
    echo
    echo "It is also saved in install-credentials.txt (root only). Delete that file afterwards."
  fi
  if [ "$HTTPS_OK" -eq 0 ]; then
    echo
    warn "HTTPS was not reachable yet: fix DNS or the firewall first (see above), then open the address."
  fi
}

offer_smtp() {
  [ -f ./setup-smtp.sh ] || return 0
  echo
  echo "Email (password reset, email confirmation) needs SMTP details. You can set them any time with:"
  echo "    sudo bash setup-smtp.sh"
  [ "$ASSUME_YES" -eq 1 ] && return 0
  [ -t 0 ] || return 0
  if confirm "Set up email now?"; then bash ./setup-smtp.sh || warn "Email setup did not finish; run  sudo bash setup-smtp.sh  later."; fi
}

# ------------------------------------------------------------------ main
trap 'rc=$?; [ "$rc" -eq 0 ] || printf "\nThe installer stopped. Nothing is lost: fix the problem above and run it again.\n" >&2' EXIT

[ -f docker-compose.yml ] || die "docker-compose.yml not found. Run this script from the unpacked AutoHub folder."
need_root
[ "$DRY_RUN" -eq 0 ] || info "Dry run: nothing will be changed."

resolve_settings
info "Website: $APP_DOMAIN    API: $API_DOMAIN    Notices: $ACME_EMAIL"

if [ "$SKIP_CHECKS" -eq 0 ]; then check_os; check_resources; fi
install_docker
ensure_curl
if [ "$SKIP_CHECKS" -eq 0 ]; then check_ports; check_dns; fi
open_firewall
write_env

info "Building and starting the site (the first build takes several minutes)..."
run docker compose up -d --build

if [ "$DRY_RUN" -eq 1 ]; then
  info "Dry run finished. Run again without --dry-run to install."
  exit 0
fi

wait_for_backend
[ "$VERIFY" -eq 0 ] || verify_https
summary
offer_smtp
