# Safex recovery implementation — 5 September 2026

## Repository-side repair

- Original PWA source/UI and the PR #3/#4 refinements are preserved.
- Default root build/deployment now selects static `safex/`, not Next.js.
- SafetyOS, including PR #5's near-miss and PDF/DOCX features, is retained in `safetyos/`.
- Separate deployment scripts prevent SafetyOS from targeting the original Safex project.
- Safex release is explicitly `safex-v84`; builds are reproducible and stale output is tested.
- Cache cleanup preserves unrelated caches and pending offline report localStorage.
- An enhanced CI template validates both apps and uses pinned Vercel tooling. Its
  activation is blocked by the GitHub App lacking `workflows` permission; the active
  legacy workflow is preserved unchanged. The root Vercel build runs static tests.
- Next.js stays on the supported 15.x release line (15.5.25), with patched PostCSS and
  Sharp overrides. A native Sharp encode/decode check and a production build are required.
- Stale hardcoded success domains and sandbox-specific deploy paths were removed.

This is a reconstructed repair based on Git history, not application of an unavailable
previous-session patch. `safex-restore-original.patch` was not present in the workspace
or published GitHub histories when the review began.

## Validation commands

```sh
npm ci --prefix safex-src --include=dev --ignore-scripts
npm test
npm run check:generated
npm ci --prefix safetyos --include=dev --ignore-scripts
npm run typecheck:safetyos
npm run build:safetyos
npm audit --prefix safetyos
```

## Production/owner actions that code alone cannot establish

- Install `vercel-tools/deploy-safex.workflow.yml` as the active workflow using an
  authorized GitHub connection/editor. The App cannot write workflow files.
- Review/merge the restore PR and verify the actual Vercel production domain. This
  session's changes and pushes are confined to `arena/01a06fd8-safexos`.
- Vercel login/project settings require an authorized connection. GitHub Actions can
  deploy only if workflow permissions and the existing deployment secret are valid.
- Revoke historically exposed credentials and rotate the Actions secret if necessary.
  The old workspace archive is still reachable in Git history; it was not extracted.
- Plan coordinated history sanitization separately. Do not blindly reset or force-push
  main, delete data, or reintroduce an old workspace archive to restore the frontend.
- Verify production Supabase RLS, migration state and removal of demo accounts. No
  database, storage object, user account or seed data is changed by frontend deployment.
- The CSMS public-report finding needs an explicit access-control rollout; do not assume
  that restoring the original PWA automatically makes the separate app's reports private.
- GitHub Pages remains a separate base-path/publication task; see DEPLOY.md.

A passing build, a preview, an open PR, and a live production restoration are different
states. Record the actual deployment/check result rather than treating one as another.
