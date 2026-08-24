#!/usr/bin/env bash
# SafetyOS — production deploy to Vercel (project: musahidsafetyox)
# Portable: runs from anywhere; dirs are resolved relative to this script
# (override with SAFETYOS_DIR / VERCEL_TOOLS_DIR env vars if needed).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="${SAFETYOS_DIR:-$REPO_ROOT/safetyos}"
VERCEL_TOOLS_DIR="${VERCEL_TOOLS_DIR:-$SCRIPT_DIR}"
CLI="$VERCEL_TOOLS_DIR/node_modules/.bin/vercel"

[ -x "$CLI" ] || { echo "✗ Vercel CLI not found at $CLI — run: (cd $VERCEL_TOOLS_DIR && npm install)"; exit 1; }
[ -d "$APP_DIR" ] || { echo "✗ App dir not found: $APP_DIR"; exit 1; }
cd "$APP_DIR"

echo "→ Checking Vercel auth…"
if ! "$CLI" whoami >/dev/null 2>&1; then
  echo "✗ Not authenticated. Run: $CLI login <your-email> and click the emailed link."
  exit 1
fi
echo "✓ Authenticated as: $("$CLI" whoami)"

# Create the project if it doesn't exist yet
if ! "$CLI" project ls 2>/dev/null | grep -qi musahidsafetyox; then
  echo "→ Creating project musahidsafetyox…"
  "$CLI" project add musahidsafetyox --yes || true
fi

echo "→ Linking project…"
"$CLI" link --yes --project musahidsafetyox || true

echo "→ Deploying to production with env vars…"
"$CLI" deploy --prod --yes \
  --env NEXT_PUBLIC_SUPABASE_URL="https://ixfwhxjtajmrdndhtsub.supabase.co" \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_PaR8QjtqO9nq593ekRfg7Q_PzsOCg2-" \
  --env NEXT_PUBLIC_DEMO_MODE="false"

echo ""
echo "✓ DEPLOYED — live at: https://musahidsafetyox.vercel.app"
