/* Smoke test: anti-inspection layer in the BUILT pages.
   Verifies right-click / shortcut / selection blocking + the
   no-selection CSS are present and functional in the build output. */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const page = path.resolve(__dirname, '..', 'safex', 'offline.html');
const html = fs.readFileSync(page, 'utf8');

let results = [];
function check(name, cond, extra) {
  results.push({ name, ok: !!cond, extra: extra === undefined ? '' : extra });
}

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.test/' });
const { window } = dom;
const { document } = window;

setTimeout(() => {
  try {
    // ── static guarantees ──
    check('no-selection CSS injected', /user-select:\s*none/.test(html));
    check('input/textarea selection exception present',
      /input,\s*textarea/.test(html) && /user-select:\s*text/.test(html));

    // ── behavior: context menu blocked ──
    const ctx = new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    document.dispatchEvent(ctx);
    check('right-click (contextmenu) blocked', ctx.defaultPrevented);

    // ── behavior: image drag blocked ──
    const drag = new window.Event('dragstart', { bubbles: true, cancelable: true });
    document.dispatchEvent(drag);
    check('image drag start blocked', drag.defaultPrevented);

    // ── behavior: view-source / save / print shortcuts blocked ──
    const kd = (key, mods) => {
      const e = new window.KeyboardEvent('keydown', Object.assign({ key, bubbles: true, cancelable: true }, mods));
      document.dispatchEvent(e);
      return e.defaultPrevented;
    };
    check('Ctrl+U (view source) blocked', kd('u', { ctrlKey: true }));
    check('Ctrl+S (save page) blocked', kd('s', { ctrlKey: true }));
    check('Ctrl+P (print) blocked', kd('p', { ctrlKey: true }));
    check('F12 (devtools) blocked', kd('F12', {}));
    check('Ctrl+Shift+I (devtools) blocked', kd('i', { ctrlKey: true, shiftKey: true }));
    check('Ctrl+Shift+J (console) blocked', kd('j', { ctrlKey: true, shiftKey: true }));
    check('Ctrl+Shift+C (inspect) blocked', kd('c', { ctrlKey: true, shiftKey: true }));
    check('Cmd+U (mac view source) blocked', kd('u', { metaKey: true }));

    // ── behavior: normal typing NOT blocked ──
    check('plain key "a" not blocked', !kd('a', {}));
    check('Enter not blocked', !kd('Enter', {}));
    check('Ctrl+A (select in inputs) not blocked', !kd('a', { ctrlKey: true }));

    // ── behavior: selection blocked outside inputs ──
    const sel1 = new window.Event('selectstart', { bubbles: true, cancelable: true });
    document.body.dispatchEvent(sel1);
    check('text selection (body) blocked', sel1.defaultPrevented);

    const inp = document.createElement('input');
    document.body.appendChild(inp);
    const sel2 = new window.Event('selectstart', { bubbles: true, cancelable: true });
    inp.dispatchEvent(sel2);
    check('selection allowed inside input', !sel2.defaultPrevented);

    // summary
    const failed = results.filter(r => !r.ok);
    console.log('=== PROTECT TEST RESULTS ===');
    results.forEach(r => console.log((r.ok ? '  ✅ ' : '  ❌ ') + r.name));
    console.log(failed.length ? `\n${failed.length} FAILED` : '\nALL PASSED');
    process.exit(failed.length ? 1 : 0);
  } catch (e) {
    console.error('TEST CRASH:', e);
    process.exit(2);
  }
}, 800);
