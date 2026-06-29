#!/usr/bin/env bash
# =====================================================================
#  Sime - full-stack deploy launcher (backend + frontend + landing)
#
#  Builds once, then starts all three services with mapped, cross-wired
#  ports. Ctrl-C stops everything. Logs go to .deploy-logs/.
#
#  Usage:
#    ./start-all.sh                       build + start all
#    SKIP_BUILD=1 ./start-all.sh          fast restart, reuse build
#    SKIP_INSTALL=1 ./start-all.sh        skip npm install check
#    BACKEND_PORT=5000 FRONTEND_PORT=3001 LANDING_PORT=9000 ./start-all.sh
#
#  Requires: node, npm, curl. PostgreSQL (5432) + Redis (6379) should be
#  running for full backend function; the script warns but starts anyway.
#
#  COOKIES / NODE_ENV: the backend is started WITHOUT NODE_ENV=production
#  on purpose. It only sets the session-cookie `Secure` flag in
#  production, and Secure cookies are dropped over plain http://localhost,
#  which breaks login. For a real HTTPS deploy, set NODE_ENV=production
#  here and terminate TLS in front of the backend.
# =====================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# ---- ports (override via env) ----
BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
LANDING_PORT="${LANDING_PORT:-8080}"
SKIP_BUILD="${SKIP_BUILD:-0}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"

LOG_DIR="$ROOT/.deploy-logs"
mkdir -p "$LOG_DIR"

# ---- cross-service wiring ----
export BACKEND_URL="http://localhost:${BACKEND_PORT}"
export FRONTEND_ORIGIN="http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT}"

c_b='\033[34m'; c_g='\033[32m'; c_y='\033[33m'; c_r='\033[31m'; c_d='\033[2m'; c_0='\033[0m'
log()  { printf "${c_b}[deploy]${c_0} %s\n" "$1"; }
ok()   { printf "${c_g}[deploy]${c_0} %s\n" "$1"; }
warn() { printf "${c_y}[deploy] WARN${c_0} %s\n" "$1"; }
die()  { printf "${c_r}[deploy] ERROR${c_0} %s\n" "$1"; exit 1; }

pids=()
cleanup() {
  echo
  log "shutting down..."
  for pid in "${pids[@]:-}"; do
    kill -0 "$pid" 2>/dev/null && kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  ok "all services stopped."
}
trap cleanup INT TERM EXIT

# ---- advisory infra check (does not block) ----
port_open() { (exec 3<>"/dev/tcp/$1/$2") 2>/dev/null && exec 3>&- && return 0 || return 1; }
port_open 127.0.0.1 5432 || warn "PostgreSQL not reachable on :5432 (DB features degraded)."
port_open 127.0.0.1 6379 || warn "Redis not reachable on :6379 (jobs fall back to Postgres)."

# ---- install only when node_modules is missing ----
maybe_install() {
  [ "$SKIP_INSTALL" = "1" ] && return 0
  if [ ! -d "$1/node_modules" ]; then
    log "installing deps in $1 ..."
    (cd "$1" && npm install) || die "npm install failed in $1"
  fi
}
maybe_install backend
maybe_install frontend

# ---- build (skip with SKIP_BUILD=1) ----
if [ "$SKIP_BUILD" = "1" ]; then
  log "SKIP_BUILD=1, reusing backend/dist and frontend/.next"
else
  log "building backend (tsc) ..."
  (cd backend && npm run build) || die "backend build failed"
  log "building frontend (next build) ..."
  (cd frontend && npm run build) || die "frontend build failed"
fi

# ---- start backend ----
# NOTE: launch node directly (not `npm start`). Under Git Bash on Windows
# the npm bash shim fails to fork in background ("Could not determine
# Node.js install directory" / cygheap copy failed). `exec node` avoids it.
log "starting backend on :${BACKEND_PORT} ..."
( cd backend && PORT="$BACKEND_PORT" exec node dist/server.js >"$LOG_DIR/backend.log" 2>&1 ) &
pids+=($!)

# ---- wait for backend health ----
log "waiting for backend health ..."
ready=0
for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:${BACKEND_PORT}/health" >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
[ "$ready" = "1" ] && ok "backend healthy." || warn "backend health timed out; continuing (see $LOG_DIR/backend.log)."

# ---- start frontend ----
sleep 1
log "starting frontend on :${FRONTEND_PORT} ..."
( cd frontend && exec node node_modules/next/dist/bin/next start -p "$FRONTEND_PORT" >"$LOG_DIR/frontend.log" 2>&1 ) &
pids+=($!)

# ---- start landing ----
sleep 1
log "starting landing on :${LANDING_PORT} ..."
( exec node scripts/serve-landing.mjs "$LANDING_PORT" >"$LOG_DIR/landing.log" 2>&1 ) &
pids+=($!)

echo
ok "Sime is up:"
printf "  landing   ${c_d}->${c_0} http://localhost:%s\n" "$LANDING_PORT"
printf "  frontend  ${c_d}->${c_0} http://localhost:%s\n" "$FRONTEND_PORT"
printf "  backend   ${c_d}->${c_0} http://localhost:%s  ${c_d}(health: /health)${c_0}\n" "$BACKEND_PORT"
printf "  logs      ${c_d}->${c_0} %s\n" "$LOG_DIR"
echo
log "press Ctrl-C to stop all services."
wait
