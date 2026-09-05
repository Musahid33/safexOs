# Safex

The **original Safex safety portal/PWA** is the default application in this repository.
The separate **SafetyOS Next.js application** (including the near-miss investigation,
PDF/DOCX and CSMS features) is preserved in [`safetyos/`](safetyos/README.md).

| Directory | Purpose |
|---|---|
| `safex-src/` | Readable source and build/tests for the original Safex PWA |
| `safex/` | Committed, reproducible static deployment output — do not edit by hand |
| `safetyos/` | Independent Next.js app; must use a separate Vercel project |
| `scripts/` | Local PWA preview and deployment/reproducibility regression checks |
| `vercel-tools/` | Guarded deployment scripts and pinned CLI dependencies |
| `db-tools/` | Database tooling — not part of frontend restoration |

## Original Safex: local preview

Requires Node.js 22.

```sh
npm ci --prefix safex-src --include=dev --ignore-scripts
npm run build
npm test
npm run check:generated
npm run dev
```

The local preview listens on `0.0.0.0:3000` and serves only `safex/`.
It is not a production deployment. The original PWA still uses its configured
Supabase backend; do not submit test records to a live database without authorization.

## SafetyOS: separate app

```sh
npm ci --prefix safetyos --include=dev --ignore-scripts
# Configure safetyos/.env.local using safetyos/.env.local.example.
npm run dev:safetyos
```

Stop the PWA preview first, or choose a different port, because both defaults use 3000.
Run `npm run typecheck:safetyos` and `npm run build:safetyos` for validation.

## Deployment and recovery

See [DEPLOY.md](DEPLOY.md) and [RESTORE-STATUS.md](RESTORE-STATUS.md).
Root `vercel.json` explicitly builds and serves **static Safex**, not Next.js.
Never infer a live domain from the Vercel project name, and never deploy SafetyOS
to the Safex PWA project. A green build alone does not verify the user-facing domain.
