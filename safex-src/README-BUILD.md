# Safex production build

**Source of truth:** `safex-src/` · **generated output:** `safex/`.
Paths are relative to this checkout, not a particular sandbox home directory.

```sh
# From repository root, using Node.js 22:
npm ci --prefix safex-src --include=dev --ignore-scripts
npm run build
npm test
npm run check:generated
```

The builder minifies HTML/JS, obfuscates app scripts with a fixed seed, self-hosts
vendor scripts, hashes assets, and copies production headers. No source maps are
created. Anti-inspection UI behavior is retained; it is not an authorization boundary.

## Reproducible releases and service worker updates

- Edit only `safex-src/`; rebuild and commit changed output under `safex/`.
- The version in `safex-src/sw.js` is the **exact emitted version**. Increase it
  deliberately whenever a release changes cached content. The restoration release
  is `safex-v85`, newer than the previous deployed `safex-v83`.
- Builds never increment or mutate source automatically. Repeated builds from the
  same source/lockfile produce identical output; `npm run check:generated` enforces it.
- Older builds calculated an in-memory +1 without writing it back, so rerunning a
  build did not actually advance the release version. Do not rely on that behavior.
- Activation removes only obsolete `safex-v*` caches, not unrelated app caches or
  localStorage. Pending offline reports are not deleted.

Optional `SAFEX_SRC` and `SAFEX_OUT` override paths for isolated validation. Output
must be a dedicated directory, never the source or repository root.

## Tests

The original 49 checks cover gallery escaping/rendering, report status/confidentiality,
training, alerts, anti-inspection behavior and service-worker artifacts. Root tests add
deployment isolation, matching headers, explicit cache versions, safe cache cleanup
and offline navigation fallback. These are local/mocked tests, not proof of live DB/RLS.

See [../DEPLOY.md](../DEPLOY.md) for deployment. Never publish the repository-root
Next.js app to the original Safex project; SafetyOS now lives separately in `safetyos/`.
