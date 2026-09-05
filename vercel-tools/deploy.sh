#!/usr/bin/env bash
# Optional SafetyOS deployment. Never deploy this app onto the Safex PWA project.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="$ROOT/vercel-tools/node_modules/.bin/vercel"
MODE="${1:-preview}"
PROJECT_ID="${SAFETYOS_VERCEL_PROJECT_ID:?Set the SEPARATE SafetyOS project ID}"
ORG_ID="${SAFETYOS_VERCEL_ORG_ID:?Set the SafetyOS team ID}"
[[ "$MODE" == preview || "$MODE" == production ]] || { echo 'Usage: deploy.sh [preview|production]' >&2; exit 1; }
[[ "$PROJECT_ID" == prj_* && "$ORG_ID" == team_* ]] || { echo 'Explicit Vercel project/team IDs are required.' >&2; exit 1; }
[[ "$PROJECT_ID" != prj_rVy1qszPjNsZj9TavW0XbufH9fTo ]] || { echo 'Refusing to replace the original Safex PWA with SafetyOS.' >&2; exit 1; }
[[ -x "$CLI" ]] || { echo 'Run npm ci --prefix vercel-tools first.' >&2; exit 1; }
export VERCEL_PROJECT_ID="$PROJECT_ID" VERCEL_ORG_ID="$ORG_ID" VERCEL_TELEMETRY_DISABLED=1
args=(--yes --project "$PROJECT_ID" --scope "$ORG_ID")
if [[ -n "${VERCEL_TOKEN:-}" ]]; then args+=(--token "$VERCEL_TOKEN");
elif ! "$CLI" whoami >/dev/null 2>&1; then
  echo 'Vercel access is not configured. Use browser login or a GitHub Actions secret.' >&2
  exit 1
fi
[[ "$MODE" != production ]] || args+=(--prod)
npm --prefix "$ROOT/safetyos" run typecheck
npm --prefix "$ROOT/safetyos" run build
"$CLI" deploy "$ROOT/safetyos" "${args[@]}"
