# Deploying Safex and SafetyOS safely

## Original Safex — default deployment

The root `vercel.json` explicitly sets:

- Framework: **Other** (`framework: null`)
- Repository root: **`.`** (leave Vercel Root Directory empty)
- Install: `npm ci --prefix safex-src --include=dev --ignore-scripts`
- Build: `npm run build && npm test`
- Output: **`safex`**

These settings restore the original PWA without deleting the separate Next.js app.
Remove any incompatible dashboard-only Next.js build/output overrides. Do not set
the Safex project's root to `safetyos/`.

A direct deployment from `safex/` also remains supported by its static `vercel.json`.
The Git integration and Actions path both publish the same PWA, not competing apps.

### Git integration / pull request

Push the repair branch and open a PR into `main`. Review the Vercel preview and CI.
Merging the PR changes the default Git-integrated deployment to the static app.
Use the actual deployment/alias URLs in Vercel's Domains screen; a project called
`safex` does **not** imply ownership of `safex.vercel.app`.

### GitHub Actions

The existing `.github/workflows/deploy-safex.yml` is preserved unchanged: it
publishes committed `safex/` output on matching `main` pushes or manual dispatch.
The root Vercel Git-integrated build runs the new static build/tests independently.

**Enhanced workflow ready:** `vercel-tools/deploy-safex.workflow.yml` validates both
apps, checks reproducibility, pins deployment identity/tooling and gates production.
The current GitHub App rejected updating `.github/workflows/` because it lacks
`workflows` permission. The owner must install that template at
`.github/workflows/deploy-safex.yml` through an authorized GitHub connection/editor.
Do not assume those enhanced Actions checks are active before it is installed.

The existing repository Actions secret `VERCEL_TOKEN` must be valid for the Safex
team/project. Never put it in a file or paste it in chat. If it is an old exposed
token, revoke it and replace the Actions secret through GitHub settings.

**Dispatch behavior differs:** the existing workflow deploys production immediately
when manually dispatched. The enhanced template defaults to validation only and
requires `production: true` for an explicit production run. Check which version is
installed before dispatching a workflow.

### Local CLI (optional)

```sh
npm ci --prefix safex-src --include=dev --ignore-scripts
npm ci --prefix vercel-tools --ignore-scripts
./vercel-tools/node_modules/.bin/vercel login  # browser login; no tokens in chat
bash vercel-tools/deploy-safex.sh              # preview by default
bash vercel-tools/deploy-safex.sh production  # explicit production deploy
```

The script is pinned to the existing Safex project ID and team ID established by
GitHub deployment metadata. It rejects conflicting ID overrides, builds/tests the
PWA, and prints Vercel's actual returned URL. It does not create projects, silently
ignore link errors, guess domains, or retrieve credentials from Git history.

## SafetyOS — separate project only

1. Create or identify a **separate** Vercel project and configure its root as `safetyos/`.
2. Framework: Next.js; use `safetyos/vercel.json` and its own package lockfile.
3. Configure the public Supabase URL/key and `NEXT_PUBLIC_DEMO_MODE` in that project.
   See `safetyos/.env.local.example`. Public keys are not authorization; RLS is required.
4. Verify required migrations and accounts through authorized database administration.
   A frontend build does not establish that a migration was applied.

Optional CLI deployment requires explicit non-secret IDs:

```sh
npm ci --prefix safetyos --include=dev --ignore-scripts
npm ci --prefix vercel-tools --ignore-scripts
SAFETYOS_VERCEL_PROJECT_ID=prj_SEPARATE_PROJECT \
SAFETYOS_VERCEL_ORG_ID=team_YOUR_TEAM \
  bash vercel-tools/deploy.sh                 # preview first
```

The script refuses the Safex PWA project ID. Append `production` only after validating
the separate preview. `vercel-tools/deploy-safetyos.workflow.yml` is an optional,
inactive template; enable it only after setting its separate project variables.

## Verify the actual restored site

- Check the confirmed production domain, not a hardcoded URL in old documentation.
- Confirm the original homepage, officer login, employee profile and CSMS login.
- Confirm JavaScript, icons, `/manifest.json` and `/sw.js` load without 404s.
- Verify login and normal report flows with authorized test data.
- Check a fresh browser and an existing installed PWA. This recovery uses `safex-v85`.
- Do not clear all site storage: pending offline reports live in localStorage. Sync or
  back them up before any user-initiated data reset. The recovery does not erase them.

## GitHub Pages is a different hosting target

The existing legacy Pages setup publishes repository root `/`, which is not the
static build directory. The PWA also uses origin-root URLs, not `/safexOs/` URLs.
Do not treat a green Pages job as the Safex Vercel production deployment. Supporting
Pages needs a separate base-path-aware publishing configuration or a verified custom
domain. This Vercel recovery does not silently change Pages settings or invent a domain.
