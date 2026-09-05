#!/usr/bin/env bash
# Deploy ONLY the original Safex static output to the verified Safex project.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="$ROOT/vercel-tools/node_modules/.bin/vercel"
MODE="${1:-preview}"
PROJECT_ID="prj_rVy1qszPjNsZj9TavW0XbufH9fTo"
ORG_ID="team_Adtj4KLDwmkAW5JKZdFYQPzf"
[[ "$MODE" == preview || "$MODE" == production ]] || { echo 'Usage: deploy-safex.sh [preview|production]' >&2; exit 1; }
[[ -x "$CLI" ]] || { echo 'Run npm ci --prefix vercel-tools first.' >&2; exit 1; }
[[ -z "${VERCEL_PROJECT_ID:-}" || "$VERCEL_PROJECT_ID" == "$PROJECT_ID" ]] || { echo 'Refusing a conflicting VERCEL_PROJECT_ID.' >&2; exit 1; }
[[ -z "${VERCEL_ORG_ID:-}" || "$VERCEL_ORG_ID" == "$ORG_ID" ]] || { echo 'Refusing a conflicting VERCEL_ORG_ID.' >&2; exit 1; }
export VERCEL_PROJECT_ID="$PROJECT_ID" VERCEL_ORG_ID="$ORG_ID" VERCEL_TELEMETRY_DISABLED=1
args=(--yes --project "$PROJECT_ID" --scope "$ORG_ID")
if [[ -n "${VERCEL_TOKEN:-}" ]]; then args+=(--token "$VERCEL_TOKEN");
elif ! "$CLI" whoami >/dev/null 2>&1; then
  echo 'Vercel access is not configured. Use browser login or the GitHub Actions secret; never paste tokens in chat.' >&2
  exit 1
fi
[[ "$MODE" != production ]] || args+=(--prod)
cd "$ROOT"
npm run build
npm test
npm run check:generated
# Explicit --project/--scope prevents a stale local link from selecting another app.
URL="$("$CLI" deploy "$ROOT/safex" "${args[@]}")"
[[ "$URL" =~ ^https://[a-zA-Z0-9.-]+\.vercel\.app/?$ ]] || { echo 'Deployment returned an unexpected URL. Check Vercel; no success URL was guessed.' >&2; exit 1; }
printf 'Safex deployment: %s\n' "$URL"
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then printf 'url=%s\n' "$URL" >> "$GITHUB_OUTPUT"; fi
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then printf '### Original Safex deployment\n\n%s\n' "$URL" >> "$GITHUB_STEP_SUMMARY"; fi
