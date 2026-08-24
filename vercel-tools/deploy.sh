#!/usr/bin/env bash
# SafetyOS — production deploy to Vercel (project: musahidsafetyox)
set -euo pipefail

APP_DIR="/home/user/safetyos"
CLI="/home/user/vercel-tools/node_modules/.bin/vercel"
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
