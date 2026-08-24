# Safex — Production Build Pipeline

**Source of truth:** this folder (`safex-src`) — readable, commented source.
**Deploy root:** `/home/user/safex` — hardened build output only (never edit by hand).

## Why a build step?

- Minify + obfuscate all JS (inline & external) with Terser
- Strip all comments, `console.*`, `debugger`
- Hash every asset filename (content hash) for immutable caching
- Self-host vendor libs (supabase-js, lucide, tailwind) — no runtime CDN
- Never generate source maps
- Security headers ship via `vercel.json`

## How to build & deploy

```bash
cd /home/user/safex-src
npm install                              # after sandbox restart
node build.js                            # bumps SW cache version, builds to /home/user/safex
cd /home/user/safex
vercel deploy --prod --yes
```

## Rules

1. Edit ONLY files in `safex-src`. `safex/` is regenerated.
2. Inline `onclick="fn()"` handler names must not be renamed — Terser is configured
   with `mangle` (locals only) for exactly this reason.
3. Never add source maps (`sourceMap: false` in build.js).
4. New CDN libs? Download the exact pinned version into `vendor/` and add a
   `<script src="/assets/vendor/<name>.min.js">` tag — build.js hashes it.
5. Cache bust: `node build.js` auto-bumps the `safex-vNN` string in `sw.js`.

## Tests

`/tmp/testenv/testhard.js` (jsdom harness) runs 12 scenarios against the BUILT
output. Run it after every build before deploying.
