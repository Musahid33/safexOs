/* Smoke test: the BUILT service worker (safex/sw.js) — hardened/obfuscated.
   Executes it in Node with stubbed ServiceWorkerGlobalScope APIs and
   verifies: all event handlers register, the cache name is the bumped
   version, and every precached URL resolves to a real build artifact. */

const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'safex');
const src = fs.readFileSync(path.join(OUT, 'sw.js'), 'utf-8');

const captured = {};
const selfStub = {
  addEventListener: (ev, fn) => { captured[ev] = fn; },
  skipWaiting: () => {},
  clients: { claim: () => {} },
};
const cachesStub = {
  open: async (name) => {
    captured.cacheName = name;
    return {
      addAll: async (urls) => { captured.addAll = urls; },
      put: async () => {},
      match: async () => null,
      keys: async () => [],
      delete: async () => {},
    };
  },
};

new Function('self', 'caches', 'fetch', 'Request', 'Notification', src)(
  selfStub,
  cachesStub,
  async (u) => ({ url: typeof u === 'string' ? u : u.url }),
  class { constructor(url) { this.url = url; } },
  class {}
);

captured.install({
  preventDefault() { captured.pd = true; },
  waitUntil: (p) => p,
});

setTimeout(() => {
  let failed = 0;
  const check = (name, cond) => {
    console.log((cond ? '  ✅ ' : '  ❌ ') + name);
    if (!cond) failed++;
  };
  console.log('=== SW TEST RESULTS ===');
  check('install handler registered', !!captured.install);
  check('activate handler registered', !!captured.activate);
  check('fetch handler registered', !!captured.fetch);
  check('message handler registered', !!captured.message);
  check('cache name is safex-v< n>', /^safex-v\d+$/.test(captured.cacheName || ''));
  check('precache list captured', Array.isArray(captured.addAll) && captured.addAll.length > 0);

  const missing = (captured.addAll || []).filter(
    (u) => typeof u !== 'string' || !fs.existsSync(path.join(OUT, u.replace(/^\//, '')))
  );
  (captured.addAll || []).forEach((u) =>
    console.log(
      '    ' +
        (typeof u === 'string' && fs.existsSync(path.join(OUT, u.replace(/^\//, ''))) ? 'OK  ' : 'MISSING  ') +
        u
    )
  );
  check('all precache assets exist in build', missing.length === 0);

  console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
  process.exit(failed ? 1 : 0);
}, 800);
