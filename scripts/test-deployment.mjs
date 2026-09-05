import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
const json = p => JSON.parse(read(p));

test('default Vercel build serves the original PWA, not Next.js', () => {
  const config = json('vercel.json');
  assert.equal(config.framework, null);
  assert.equal(config.outputDirectory, 'safex');
  assert.equal(config.buildCommand, 'npm run build && npm test');
  assert.match(config.installCommand, /npm ci --prefix safex-src/);
  assert.equal(json('package.json').scripts.build, 'npm --prefix safex-src run build');
  assert.equal(json('package.json').dependencies?.next, undefined);
  assert.equal(existsSync(join(root, 'next.config.mjs')), false);
});

test('root and direct static deployment use the same security/cache headers', () => {
  assert.deepEqual(json('vercel.json').headers, json('safex-src/vercel.json').headers);
  assert.deepEqual(json('safex/vercel.json'), json('safex-src/vercel.json'));
});

test('SafetyOS is preserved and cannot implicitly claim the Safex project', () => {
  const config = json('safetyos/vercel.json');
  assert.equal(config.framework, 'nextjs');
  assert.equal(config.name, undefined);
  for (const file of ['src/lib/near-miss-workflow.ts', 'src/lib/report-generator.ts', 'src/lib/report-saver.ts', 'supabase/schema.sql']) {
    assert.ok(existsSync(join(root, 'safetyos', file)), `${file} must be preserved`);
  }
  assert.match(read('vercel-tools/deploy.sh'), /SAFETYOS_VERCEL_PROJECT_ID/);
  assert.match(read('vercel-tools/deploy.sh'), /prj_rVy1qszPjNsZj9TavW0XbufH9fTo/);
});

test('all original public pages remain in the deploy output', () => {
  for (const name of ['index', 'officer-dashboard', 'employee-profile', 'csms-login', 'csms-dashboard', 'admin-otp', 'offline']) {
    assert.match(read(`safex/${name}.html`), /<html/i);
  }
  assert.match(read('safex/index.html'), /galleryScrollInner/);
  assert.doesNotMatch(read('safex/index.html'), /_next\/static/);
});

test('worker cache version is explicit and matches the built release', async () => {
  const expected = read('safex-src/sw.js').match(/const CACHE = '(safex-v\d+)'/)[1];
  const captured = {};
  const handlers = {};
  runInNewContext(read('safex/sw.js'), {
    self: { addEventListener: (name, fn) => handlers[name] = fn, skipWaiting() {}, clients: { claim() {} } },
    caches: { open: async name => { captured.name = name; return { addAll: async () => {} }; } },
  });
  let done;
  handlers.install({ waitUntil: promise => done = promise });
  await done;
  assert.equal(captured.name, expected);
  assert.notEqual(expected, 'safex-v83', 'Recovery must invalidate the prior release cache');
});

test('worker activation only removes obsolete Safex caches', async () => {
  const handlers = {}, removed = [];
  const expected = read('safex-src/sw.js').match(/const CACHE = '(safex-v\d+)'/)[1];
  runInNewContext(read('safex/sw.js'), {
    self: { addEventListener: (name, fn) => handlers[name] = fn, clients: { claim() {} } },
    caches: { keys: async () => ['safex-v82', 'safex-v83', expected, 'another-app'], delete: async name => removed.push(name) },
  });
  let done;
  handlers.activate({ waitUntil: promise => done = promise });
  await done;
  assert.deepEqual(removed, ['safex-v82', 'safex-v83']);
});

test('navigation falls back to offline.html when request and index caches miss', async () => {
  const handlers = {}, offline = { offline: true };
  runInNewContext(read('safex/sw.js'), {
    URL,
    self: { addEventListener: (name, fn) => handlers[name] = fn },
    fetch: async () => { throw new Error('offline'); },
    caches: { match: async key => key === '/offline.html' ? offline : undefined },
  });
  let response;
  handlers.fetch({ request: { method: 'GET', url: 'https://example.test/missing.html', mode: 'navigate' }, respondWith: p => response = p });
  assert.equal(await response, offline);
});


test('embedded preview geometry does not trigger the DevTools warning overlay', () => {
  const require = createRequire(new URL('../safex-src/package.json', import.meta.url));
  const { JSDOM } = require('jsdom');
  const page = new JSDOM(read('safex/offline.html'));
  const protect = page.window.document.querySelector('script').textContent;
  const parent = new JSDOM('<body></body>', { runScripts: 'dangerously', url: 'https://preview.test/' });
  try {
    const iframe = parent.window.document.createElement('iframe');
    parent.window.document.body.appendChild(iframe);
    const framed = iframe.contentWindow;
    function simulateGeometry(win) {
      Object.defineProperty(win, 'outerWidth', { value: 1500, configurable: true });
      Object.defineProperty(win, 'innerWidth', { value: 600, configurable: true });
      win.setInterval = fn => { fn(); return 1; };
      win.setTimeout = fn => { fn(); return 1; };
      win.eval(protect);
    }
    simulateGeometry(framed);
    assert.doesNotMatch(framed.document.body.textContent, /Developer tools are disabled/);
    simulateGeometry(parent.window);
    assert.match(parent.window.document.body.textContent, /Developer tools are disabled/, 'Top-level behavior is preserved');
  } finally {
    parent.window.close();
    page.window.close();
  }
});
